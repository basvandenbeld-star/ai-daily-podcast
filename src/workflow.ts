import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { readPodcastConfig, readSources, requireEnv } from "./config.js";
import { localDateInTimezone, localHourInTimezone, formatDutchDate } from "./time.js";
import { logEvent } from "./log.js";
import { addEpisodeToState, readState, withLock, writeState } from "./state.js";
import { fetchCandidates } from "./fetch.js";
import { clusterStories, selectStories } from "./cluster.js";
import { buildDescription, buildEpisodeScript, buildShowNotes } from "./script.js";
import { assertAudioValid, synthesizeSpeech } from "./audio.js";
import { slugify } from "./text.js";
import { writeStaticSite } from "./rss.js";
import type { Episode } from "./types.js";

export async function generateEpisode(options: { force?: boolean; now?: Date } = {}) {
  const config = await readPodcastConfig();
  const now = options.now ?? new Date();
  const localDate = localDateInTimezone(now, config.timezone);
  const localHour = localHourInTimezone(now, config.timezone);

  return withLock(config.dataDir, async () => {
    const state = await readState(config.dataDir);
    await logEvent(config.dataDir, { level: "info", event: "run-start", localDate, force: Boolean(options.force) });

    if (!options.force && localHour < config.publishAfterLocalHour) {
      return { ok: true, skipped: true, message: `Too early in ${config.timezone}.` };
    }
    if (!options.force && state.generatedDates.includes(localDate)) {
      return { ok: true, skipped: true, message: `Episode for ${localDate} already exists.` };
    }

    const sources = await readSources();
    const candidates = await fetchCandidates(sources, options.force ? new Set() : new Set(state.usedStoryUrls), now);
    const clusters = clusterStories(candidates, config);
    const selected = selectStories(clusters, 5);
    if (selected.length === 0) {
      throw new Error("No sufficiently reliable AI stories found for this run.");
    }

    let scriptResult = buildEpisodeScript(selected, config, localDate);
    let finalStories = selected;
    while (scriptResult.estimatedMinutes > config.targetMinutes.max && finalStories.length > 2) {
      finalStories = finalStories.slice(0, -1);
      scriptResult = buildEpisodeScript(finalStories, config, localDate);
    }

    const title = `AI Daily, ${formatDutchDate(localDate)}`;
    const episodeSlug = `${localDate}-${slugify(title)}`;
    const audioRelative = `audio/${episodeSlug}.mp3`;
    const audioPath = path.resolve(config.siteDir, audioRelative);
    const publicBaseUrl = requireEnv(config.publicBaseUrlEnv).replace(/\/$/, "");
    const feedToken = requireEnv(config.feedTokenEnv);
    const audioUrl = `${publicBaseUrl}/${audioRelative}`;

    const audio = await synthesizeSpeech({
      engine: config.tts.engine,
      text: scriptResult.script,
      voice: config.tts.voice,
      speechRate: config.tts.speechRate,
      piperModelPath: config.tts.piperModelPath,
      piperConfigPath: config.tts.piperConfigPath,
      outputMp3: audioPath
    });
    await assertAudioValid(audioPath, config.targetMinutes.max * 60);

    const episode: Episode = {
      id: episodeSlug,
      localDate,
      title,
      publishedAt: now.toISOString(),
      guid: `ai-daily-${localDate}-${crypto.randomUUID()}`,
      audioPath: audioRelative,
      audioUrl,
      audioBytes: audio.bytes,
      durationSeconds: audio.durationSeconds,
      description: buildDescription(finalStories),
      showNotesHtml: buildShowNotes(finalStories, scriptResult.rawScript),
      script: scriptResult.rawScript,
      stories: finalStories
    };

    await fs.mkdir(path.resolve(config.dataDir, "episodes"), { recursive: true });
    await fs.writeFile(
      path.resolve(config.dataDir, "episodes", `${episodeSlug}.json`),
      JSON.stringify(episode, null, 2),
      "utf8"
    );

    const nextState = addEpisodeToState(state, episode);
    nextState.lastRun = {
      startedAt: now.toISOString(),
      finishedAt: new Date().toISOString(),
      ok: true,
      message: `Generated ${episode.title}`
    };
    await writeState(config.dataDir, nextState);
    await writeStaticSite({ config, feedToken, publicBaseUrl, episodes: nextState.episodes });
    await logEvent(config.dataDir, {
      level: "info",
      event: "run-complete",
      localDate,
      stories: finalStories.length,
      durationSeconds: audio.durationSeconds
    });

    return {
      ok: true,
      skipped: false,
      episode,
      feedUrl: `${publicBaseUrl}/feed/${feedToken}/rss.xml`
    };
  });
}

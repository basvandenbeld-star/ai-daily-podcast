import fs from "node:fs/promises";
import path from "node:path";
import type { Episode, PodcastState } from "./types.js";

export const emptyState = (): PodcastState => ({
  generatedDates: [],
  usedStoryUrls: [],
  episodes: []
});

export async function readState(dataDir: string) {
  const file = path.resolve(dataDir, "state.json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as PodcastState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw error;
  }
}

export async function writeState(dataDir: string, state: PodcastState) {
  await fs.mkdir(path.resolve(dataDir), { recursive: true });
  const file = path.resolve(dataDir, "state.json");
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function withLock<T>(dataDir: string, fn: () => Promise<T>) {
  await fs.mkdir(path.resolve(dataDir), { recursive: true });
  const lock = path.resolve(dataDir, "run.lock");
  let handle: fs.FileHandle | undefined;
  try {
    handle = await fs.open(lock, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("Another podcast generation run is already active.");
    }
    throw error;
  }

  try {
    await handle.writeFile(String(process.pid));
    return await fn();
  } finally {
    await handle.close();
    await fs.rm(lock, { force: true });
  }
}

export function addEpisodeToState(state: PodcastState, episode: Episode) {
  const usedUrls = new Set(state.usedStoryUrls);
  for (const story of episode.stories) {
    for (const source of story.sources) usedUrls.add(source.url);
  }

  return {
    ...state,
    generatedDates: Array.from(new Set([episode.localDate, ...state.generatedDates])).slice(0, 400),
    usedStoryUrls: Array.from(usedUrls).slice(-3000),
    episodes: [episode, ...state.episodes.filter((item) => item.localDate !== episode.localDate)].slice(0, 365)
  };
}

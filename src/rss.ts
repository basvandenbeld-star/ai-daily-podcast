import fs from "node:fs/promises";
import path from "node:path";
import type { Episode } from "./types.js";
import type { PodcastConfig } from "./config.js";
import { escapeXml } from "./text.js";
import { formatDuration } from "./audio.js";
import { ensureArtwork } from "./artwork.js";

export async function writeStaticSite(options: {
  config: PodcastConfig;
  feedToken: string;
  publicBaseUrl: string;
  episodes: Episode[];
}) {
  const siteDir = path.resolve(options.config.siteDir);
  const feedDir = path.join(siteDir, "feed", options.feedToken);
  await fs.mkdir(feedDir, { recursive: true });
  await fs.mkdir(path.join(siteDir, "audio"), { recursive: true });
  await fs.mkdir(path.join(siteDir, "assets"), { recursive: true });
  await ensureArtwork(path.join(siteDir, "assets", "artwork.png"));

  const xml = buildRss(options.config, options.publicBaseUrl, options.feedToken, options.episodes);
  await fs.writeFile(path.join(feedDir, "rss.xml"), xml, "utf8");
  await fs.writeFile(path.join(siteDir, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8");
  await fs.writeFile(path.join(siteDir, ".nojekyll"), "", "utf8");
  await fs.writeFile(
    path.join(siteDir, "index.html"),
    "<!doctype html><html lang=\"nl\"><head><meta name=\"robots\" content=\"noindex,nofollow\"><title>AI Daily</title></head><body><h1>AI Daily</h1><p>Persoonlijke podcastfeed.</p></body></html>\n",
    "utf8"
  );
}

export function buildRss(config: PodcastConfig, publicBaseUrl: string, feedToken: string, episodes: Episode[]) {
  const selfUrl = `${publicBaseUrl.replace(/\/$/, "")}/feed/${feedToken}/rss.xml`;
  const artworkUrl = `${publicBaseUrl.replace(/\/$/, "")}/assets/artwork.png`;
  const items = episodes
    .map(
      (episode) => `<item>
  <title>${escapeXml(episode.title)}</title>
  <guid isPermaLink="false">${escapeXml(episode.guid)}</guid>
  <pubDate>${new Date(episode.publishedAt).toUTCString()}</pubDate>
  <description><![CDATA[${episode.showNotesHtml}]]></description>
  <itunes:summary><![CDATA[${episode.description}]]></itunes:summary>
  <itunes:duration>${formatDuration(episode.durationSeconds)}</itunes:duration>
  <enclosure url="${escapeXml(episode.audioUrl)}" length="${episode.audioBytes}" type="audio/mpeg" />
</item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(config.title)}</title>
  <link>${escapeXml(publicBaseUrl)}</link>
  <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
  <description>${escapeXml(config.description)}</description>
  <language>${escapeXml(config.language)}</language>
  <itunes:author>${escapeXml(config.author)}</itunes:author>
  <itunes:explicit>false</itunes:explicit>
  <itunes:block>Yes</itunes:block>
  <itunes:type>episodic</itunes:type>
  <itunes:image href="${escapeXml(artworkUrl)}" />
  <image>
    <url>${escapeXml(artworkUrl)}</url>
    <title>${escapeXml(config.title)}</title>
    <link>${escapeXml(publicBaseUrl)}</link>
  </image>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>
`;
}

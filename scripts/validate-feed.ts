import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { loadEnvFile } from "../src/env-file.js";
import { readPodcastConfig } from "../src/config.js";

loadEnvFile();

const config = await readPodcastConfig();
const token = process.env.FEED_TOKEN;
if (!token) throw new Error("FEED_TOKEN is required.");
const publicBaseUrl = process.env.PUBLIC_BASE_URL ? new URL(process.env.PUBLIC_BASE_URL) : undefined;

const feedPath = path.resolve(config.siteDir, "feed", token, "rss.xml");
const xml = await fs.readFile(feedPath, "utf8");
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const parsed = parser.parse(xml);
const channel = parsed?.rss?.channel;
if (!channel?.title || !channel?.item) throw new Error("Invalid RSS: missing channel title or item.");
const items = Array.isArray(channel.item) ? channel.item : [channel.item];
for (const item of items) {
  if (!item.guid || !item.pubDate || !item.enclosure?.["@_url"] || item.enclosure?.["@_type"] !== "audio/mpeg") {
    throw new Error(`Invalid RSS item: ${item.title ?? "untitled"}`);
  }
  const url = new URL(item.enclosure["@_url"]);
  const basePath = publicBaseUrl?.pathname.replace(/\/$/, "") ?? "";
  const audioPath = basePath && url.pathname.startsWith(`${basePath}/`)
    ? url.pathname.slice(basePath.length + 1)
    : url.pathname.replace(/^\//, "");
  const localAudio = path.resolve(config.siteDir, audioPath);
  const stat = await fs.stat(localAudio);
  if (String(stat.size) !== String(item.enclosure["@_length"])) {
    throw new Error(`Invalid RSS item: enclosure length mismatch for ${item.title ?? "untitled"}`);
  }
}
console.log(`RSS valid: ${items.length} item(s) in ${feedPath}`);

import { XMLParser } from "fast-xml-parser";
import { loadEnvFile } from "../src/env-file.js";

loadEnvFile();

const baseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
const token = process.env.FEED_TOKEN;
if (!baseUrl || !token) throw new Error("PUBLIC_BASE_URL and FEED_TOKEN are required.");

const feedUrl = `${baseUrl}/feed/${token}/rss.xml`;
const feedResponse = await fetch(feedUrl, { method: "GET" });
if (!feedResponse.ok) throw new Error(`Feed fetch failed: HTTP ${feedResponse.status}`);
const xml = await feedResponse.text();
const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" }).parse(xml);
const item = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item[0] : parsed.rss.channel.item;
const enclosureUrl = item?.enclosure?.["@_url"];
if (!enclosureUrl) throw new Error("No enclosure URL found.");

const head = await fetch(enclosureUrl, { method: "HEAD" });
if (!head.ok) throw new Error(`Audio HEAD failed: HTTP ${head.status}`);
const type = head.headers.get("content-type") ?? "";
if (!type.includes("audio/") && !type.includes("mpeg")) {
  throw new Error(`Unexpected audio content-type: ${type}`);
}

console.log(`Public feed ok: ${feedUrl}`);
console.log(`Public audio ok: ${enclosureUrl}`);

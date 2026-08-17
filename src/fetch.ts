import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import type { CandidateStory, NewsSource } from "./types.js";
import { normalizeText } from "./text.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata"
});

function arrayOf<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function textFrom(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textFrom(record["#cdata"] ?? record["#text"] ?? record["@_href"] ?? "");
  }
  return "";
}

function linkFrom(item: Record<string, unknown>) {
  const link = item.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    for (const candidate of link) {
      if (typeof candidate === "string") return candidate;
      if (candidate && typeof candidate === "object") {
        const record = candidate as Record<string, unknown>;
        if (record["@_rel"] === "alternate" && typeof record["@_href"] === "string") return record["@_href"];
      }
    }
  }
  if (link && typeof link === "object") {
    const record = link as Record<string, unknown>;
    if (typeof record["@_href"] === "string") return record["@_href"];
  }
  return textFrom(item.guid ?? item.id ?? "");
}

function publishedFrom(item: Record<string, unknown>) {
  const raw = textFrom(item.pubDate ?? item.published ?? item.updated ?? item["dc:date"] ?? "");
  const date = raw ? new Date(raw) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function isRecent(iso: string, now: Date, maxHours = 36) {
  const time = new Date(iso).getTime();
  return now.getTime() - time <= maxHours * 60 * 60 * 1000 && time <= now.getTime() + 60 * 60 * 1000;
}

async function fetchWithTimeout(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "persoonlijke-ai-nieuwspodcast/0.1 (+personal RSS reader)"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCandidates(sources: NewsSource[], usedUrls: Set<string>, now = new Date()) {
  const results = await Promise.allSettled(sources.map((source) => fetchSource(source, usedUrls, now)));
  const candidates = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.url.replace(/[#?].*$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchSource(source: NewsSource, usedUrls: Set<string>, now: Date): Promise<CandidateStory[]> {
  const xml = await fetchWithTimeout(source.url);
  const data = parser.parse(xml) as Record<string, unknown>;
  const channel = (data.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  const rssItems = arrayOf(channel?.item as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const atomItems = arrayOf((data.feed as Record<string, unknown> | undefined)?.entry as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const items = [...rssItems, ...atomItems];

  return items
    .map((item) => {
      const title = normalizeText(textFrom(item.title));
      const url = linkFrom(item).trim();
      const publishedAt = publishedFrom(item);
      const summary = normalizeText(
        textFrom(item.description ?? item.summary ?? item.content ?? item["content:encoded"] ?? "")
      );
      const id = crypto.createHash("sha256").update(`${source.name}:${url || title}`).digest("hex").slice(0, 16);
      return {
        id,
        sourceName: source.name,
        sourceUrl: source.url,
        sourceKind: source.kind,
        title,
        url,
        publishedAt,
        summary,
        topics: source.topics
      };
    })
    .filter((item) => item.title && item.url)
    .filter((item) => isRecent(item.publishedAt, now))
    .filter((item) => !usedUrls.has(item.url));
}

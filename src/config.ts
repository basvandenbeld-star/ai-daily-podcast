import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { NewsSource } from "./types.js";

const podcastSchema = z.object({
  title: z.string(),
  description: z.string(),
  language: z.string(),
  author: z.string(),
  timezone: z.string(),
  publishAfterLocalHour: z.number().int().min(0).max(23),
  targetMinutes: z.object({
    min: z.number(),
    idealMin: z.number(),
    idealMax: z.number(),
    max: z.number()
  }),
  feedTokenEnv: z.string(),
  publicBaseUrlEnv: z.string(),
  siteDir: z.string(),
  dataDir: z.string(),
  tts: z.object({
    engine: z.enum(["macos-say", "piper"]),
    voice: z.string(),
    fallbackVoices: z.array(z.string()),
    wordsPerMinute: z.number(),
    speechRate: z.number(),
    piperModelPath: z.string().optional(),
    piperConfigPath: z.string().optional()
  }),
  interests: z.array(z.string()),
  lowerPriorityPatterns: z.array(z.string())
});

const sourceSchema = z.array(
  z.object({
    name: z.string(),
    url: z.string().url(),
    kind: z.enum(["primary", "secondary"]),
    topics: z.array(z.string())
  })
);

export type PodcastConfig = z.infer<typeof podcastSchema>;

let cachedConfig: PodcastConfig | undefined;
let cachedSources: NewsSource[] | undefined;

export async function readPodcastConfig() {
  if (!cachedConfig) {
    const raw = await fs.readFile(path.resolve("config/podcast.json"), "utf8");
    cachedConfig = podcastSchema.parse(JSON.parse(raw));
  }
  return cachedConfig;
}

export async function readSources() {
  if (!cachedSources) {
    const raw = await fs.readFile(path.resolve("config/sources.json"), "utf8");
    cachedSources = sourceSchema.parse(JSON.parse(raw));
  }
  return cachedSources;
}

export function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function requireEnv(name: string) {
  const value = env(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

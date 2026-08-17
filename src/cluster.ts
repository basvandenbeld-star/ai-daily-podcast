import crypto from "node:crypto";
import type { CandidateStory, StoryCluster, StoryScores } from "./types.js";
import type { PodcastConfig } from "./config.js";
import { normalizeText, words } from "./text.js";

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "een",
  "het",
  "van",
  "voor",
  "met",
  "over",
  "naar",
  "bij",
  "door",
  "aan",
  "op",
  "in",
  "to",
  "of",
  "a",
  "an"
]);

function keywordsFor(story: CandidateStory) {
  const candidates = words(`${story.title} ${story.summary}`)
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.has(word))
    .filter((word) => !/^\d+$/.test(word));
  return Array.from(new Set(candidates)).slice(0, 30);
}

function overlap(a: string[], b: string[]) {
  const set = new Set(a);
  const matching = b.filter((item) => set.has(item)).length;
  return matching / Math.max(1, Math.min(a.length, b.length));
}

function clamp(value: number) {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function scoreCluster(stories: CandidateStory[], keywords: string[], config: PodcastConfig): StoryScores {
  const text = normalizeText(stories.map((story) => `${story.title} ${story.summary}`).join(" ")).toLowerCase();
  const primaryCount = stories.filter((story) => story.sourceKind === "primary").length;
  const sourceCount = new Set(stories.map((story) => story.sourceName)).size;
  const isPaperOnly = stories.every((story) => story.sourceName.toLowerCase().includes("arxiv"));
  const interestHits = config.interests.filter((interest) => text.includes(interest.toLowerCase())).length;
  const lowerPriorityHits = config.lowerPriorityPatterns.filter((pattern) => text.includes(pattern)).length;

  const impactTerms = [
    "release",
    "launch",
    "available",
    "general availability",
    "model",
    "agent",
    "pricing",
    "benchmark",
    "open source",
    "research",
    "safety",
    "governance",
    "education",
    "developer",
    "coding"
  ];
  const practicalTerms = ["api", "sdk", "codex", "claude code", "github", "vercel", "tool", "workflow", "available", "pricing"];
  const impactHits = impactTerms.filter((term) => text.includes(term)).length;
  const practicalHits = practicalTerms.filter((term) => text.includes(term)).length;

  const impact = clamp(3 + impactHits * 0.8 + Math.min(sourceCount, 3) - lowerPriorityHits * 1.2 - (isPaperOnly ? 1.2 : 0));
  const novelty = clamp(7.5 - lowerPriorityHits * 1.5 - (isPaperOnly && interestHits < 2 ? 1 : 0));
  const reliability = clamp(3.5 + primaryCount * 3 + Math.min(sourceCount, 3) - (isPaperOnly ? 1.2 : 0));
  const relevance = clamp(2 + interestHits * 1.4 + keywords.filter((key) => config.interests.join(" ").toLowerCase().includes(key)).length * 0.4);
  const practicalMeaning = clamp(2 + practicalHits * 1.2 + interestHits * 0.35 - lowerPriorityHits);
  const total = clamp(impact * 0.25 + novelty * 0.15 + reliability * 0.2 + relevance * 0.25 + practicalMeaning * 0.15);
  return { impact, novelty, reliability, relevance, practicalMeaning, total };
}

export function clusterStories(candidates: CandidateStory[], config: PodcastConfig): StoryCluster[] {
  const clusters: CandidateStory[][] = [];
  const keywordCache = new Map<string, string[]>();

  for (const story of candidates.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))) {
    const storyKeywords = keywordsFor(story);
    keywordCache.set(story.id, storyKeywords);
    const target = clusters.find((cluster) => overlap(storyKeywords, keywordCache.get(cluster[0].id) ?? []) > 0.34);
    if (target) target.push(story);
    else clusters.push([story]);
  }

  return clusters
    .map((stories) => {
      const primary = stories.find((story) => story.sourceKind === "primary") ?? stories[0];
      const allKeywords = Array.from(new Set(stories.flatMap((story) => keywordCache.get(story.id) ?? keywordsFor(story)))).slice(0, 24);
      const id = crypto.createHash("sha256").update(stories.map((story) => story.url).sort().join("|")).digest("hex").slice(0, 16);
      return {
        id,
        title: primary.title,
        canonicalUrl: primary.url,
        summary: primary.summary || stories.find((story) => story.summary)?.summary || primary.title,
        publishedAt: primary.publishedAt,
        sourceNames: Array.from(new Set(stories.map((story) => story.sourceName))),
        sources: stories.map((story) => ({
          title: story.title,
          url: story.url,
          sourceName: story.sourceName,
          kind: story.sourceKind
        })),
        scores: scoreCluster(stories, allKeywords, config),
        keywords: allKeywords
      };
    })
    .filter((cluster) => cluster.scores.reliability >= 5 || cluster.scores.total >= 7)
    .sort((a, b) => b.scores.total - a.scores.total);
}

export function selectStories(clusters: StoryCluster[], max = 5) {
  const selected: StoryCluster[] = [];
  const companyCounts = new Map<string, number>();
  let paperCount = 0;
  const companyPatterns = ["openai", "anthropic", "google", "deepmind", "vercel", "github", "meta", "microsoft"];

  for (const cluster of clusters) {
    const text = `${cluster.title} ${cluster.summary}`.toLowerCase();
    const isPaper = cluster.sourceNames.every((source) => source.toLowerCase().includes("arxiv"));
    if (cluster.scores.total < 5.8) continue;
    if (isPaper && cluster.scores.total < 6.3) continue;
    if (isPaper && paperCount >= 2) continue;
    const company = companyPatterns.find((pattern) => text.includes(pattern)) ?? "other";
    if ((companyCounts.get(company) ?? 0) >= 2 && cluster.scores.total < 8.5) continue;
    selected.push(cluster);
    if (isPaper) paperCount += 1;
    companyCounts.set(company, (companyCounts.get(company) ?? 0) + 1);
    if (selected.length >= max) break;
  }

  return selected.length > 0 ? selected : clusters.filter((cluster) => cluster.scores.total >= 6).slice(0, 2);
}

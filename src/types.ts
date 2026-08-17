export type SourceKind = "primary" | "secondary";

export type NewsSource = {
  name: string;
  url: string;
  kind: SourceKind;
  topics: string[];
};

export type CandidateStory = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  content?: string;
  topics: string[];
};

export type StoryScores = {
  impact: number;
  novelty: number;
  reliability: number;
  relevance: number;
  practicalMeaning: number;
  total: number;
};

export type StoryCluster = {
  id: string;
  title: string;
  canonicalUrl: string;
  summary: string;
  publishedAt: string;
  sourceNames: string[];
  sources: Array<{ title: string; url: string; sourceName: string; kind: SourceKind }>;
  scores: StoryScores;
  keywords: string[];
};

export type Episode = {
  id: string;
  localDate: string;
  title: string;
  publishedAt: string;
  guid: string;
  audioPath: string;
  audioUrl: string;
  audioBytes: number;
  durationSeconds: number;
  description: string;
  showNotesHtml: string;
  script: string;
  stories: StoryCluster[];
};

export type PodcastState = {
  generatedDates: string[];
  usedStoryUrls: string[];
  episodes: Episode[];
  lastRun?: {
    startedAt: string;
    finishedAt?: string;
    ok: boolean;
    message: string;
  };
};

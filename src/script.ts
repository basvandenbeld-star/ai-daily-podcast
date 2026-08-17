import type { StoryCluster } from "./types.js";
import type { PodcastConfig } from "./config.js";
import { escapeHtml, forSpeech, normalizeText } from "./text.js";
import { formatDutchDate } from "./time.js";

function shortSummary(story: StoryCluster) {
  const text = normalizeText(story.summary || story.title)
    .replace(/^arXiv:\S+\s+Announce Type:\s+\w+\s+Abstract:\s*/i, "")
    .replace(/\\emph\{([^}]+)\}/g, "$1")
    .replace(/\s+/g, " ");
  if (text.length <= 360) return text;
  return `${text.slice(0, 357).replace(/\s+\S*$/, "")}...`;
}

function whyRelevant(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("codex") || text.includes("claude code") || text.includes("github") || text.includes("developer")) {
    return "Voor jouw werk is vooral de praktische kant interessant: dit kan de manier veranderen waarop je AI inzet bij bouwen, debuggen en het uitproberen van nieuwe workflows.";
  }
  if (text.includes("education") || text.includes("onderwijs") || text.includes("literacy")) {
    return "De relevante vraag is hier hoe je dit vertaalt naar onderwijs en AI-geletterdheid: wat moeten mensen kunnen beoordelen, en wat kun je verantwoord laten automatiseren?";
  }
  if (text.includes("model") || text.includes("benchmark") || text.includes("multimodal")) {
    return "De praktische betekenis zit in de vraag of dit nieuwe mogelijkheden opent, of vooral een benchmarkverhaal is dat nog bewezen moet worden in dagelijks gebruik.";
  }
  if (text.includes("governance") || text.includes("safety") || text.includes("regulation")) {
    return "Belangrijk is vooral wat er concreet verandert in beschikbaarheid, verplichtingen of risico's, niet de bestuurlijke taal eromheen.";
  }
  return "De waarde zit in de concrete verandering: wat wordt makkelijker, goedkoper, breder beschikbaar, of juist minder vanzelfsprekend?";
}

function criticalNote(story: StoryCluster) {
  const hasPrimary = story.sources.some((source) => source.kind === "primary");
  if (!hasPrimary) {
    return "Kanttekening: ik zie hiervoor vooral secundaire berichtgeving. Behandel details dus als context, niet als definitieve technische documentatie.";
  }
  if (story.sources.length === 1) {
    return "Kanttekening: dit is gebaseerd op een primaire bron, maar er is nog weinig onafhankelijke duiding.";
  }
  return "De claim is redelijk controleerbaar, omdat er naast context ook een primaire of directe bron in de shownotes staat.";
}

export function buildEpisodeScript(stories: StoryCluster[], config: PodcastConfig, localDate: string) {
  const date = formatDutchDate(localDate);
  const intro =
    stories.length <= 2
      ? `Goedemorgen. Dit is AI Daily voor ${date}. Vandaag zijn er weinig harde, relevante AI-ontwikkelingen, dus ik houd het bewust compact.`
      : `Goedemorgen. Dit is AI Daily voor ${date}. Dit zijn de belangrijkste AI-ontwikkelingen van de afgelopen dag, met vooral aandacht voor wat praktisch verandert.`;

  const parts = stories.map((story, index) => {
    const sourcePhrase =
      story.sourceNames.length === 1
        ? `De bron is ${story.sourceNames[0]}.`
        : `Ik zie dit terug bij ${story.sourceNames.slice(0, 3).join(", ")}.`;
    return [
      `${index + 1}. ${story.title}.`,
      `Feitelijk: ${shortSummary(story)}`,
      sourcePhrase,
      whyRelevant(story),
      criticalNote(story)
    ].join(" ");
  });

  const outro =
    "Dat was de selectie voor vandaag. De bronlinks staan in de shownotes, zodat je de claims snel zelf kunt controleren.";
  const script = [intro, ...parts, outro].join("\n\n");

  const estimatedMinutes = script.split(/\s+/).length / config.tts.wordsPerMinute;
  return {
    script: forSpeech(script),
    rawScript: script,
    estimatedMinutes
  };
}

export function buildDescription(stories: StoryCluster[]) {
  return normalizeText(
    stories
      .map((story) => story.title)
      .slice(0, 5)
      .join(" | ")
  );
}

export function buildShowNotes(stories: StoryCluster[], rawScript: string) {
  const items = stories
    .map((story) => {
      const sources = story.sources
        .slice(0, 4)
        .map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.sourceName)}: ${escapeHtml(source.title)}</a></li>`)
        .join("");
      return `<h2>${escapeHtml(story.title)}</h2><p>Scores: impact ${story.scores.impact}, nieuwheid ${story.scores.novelty}, betrouwbaarheid ${story.scores.reliability}, relevantie ${story.scores.relevance}, praktisch ${story.scores.practicalMeaning}.</p><ul>${sources}</ul>`;
    })
    .join("");

  return `<p>Persoonlijke AI-selectie. Geen advertenties, geen tracking.</p>${items}<h2>Script</h2><p>${escapeHtml(rawScript).replace(/\n\n/g, "</p><p>")}</p>`;
}

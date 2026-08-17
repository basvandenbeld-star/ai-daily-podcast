import type { StoryCluster } from "./types.js";
import type { PodcastConfig } from "./config.js";
import { escapeHtml, forSpeech, normalizeText } from "./text.js";
import { formatDutchDate } from "./time.js";

function shortSummary(story: StoryCluster) {
  const text = normalizeText(story.summary || story.title)
    .replace(/^arXiv:\S+\s+Announce Type:\s+\w+\s+Abstract:\s*/i, "")
    .replace(/\\emph\{([^}]+)\}/g, "$1")
    .replace(/\s+/g, " ");
  if (text.length <= 620) return text;
  return `${text.slice(0, 617).replace(/\s+\S*$/, "")}...`;
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

function practicalExperiment(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("agent") && (text.includes("cost") || text.includes("token") || text.includes("routing"))) {
    return "Concreet kun je dit gebruiken als check op je eigen agent-workflows: meet niet alleen de prijs van één modelcall, maar de totale taakprijs inclusief retries, mislukte toolcalls en escalaties naar sterkere modellen.";
  }
  if (text.includes("agent") && (text.includes("permission") || text.includes("local-first") || text.includes("runtime"))) {
    return "Een nuttig experiment is om je eigen lokale agent-workflows langs drie vragen te leggen: welke tools mag de agent gebruiken, welke acties vragen expliciete toestemming, en welke logs heb je nodig om achteraf te begrijpen wat er gebeurde?";
  }
  if (text.includes("coding") || text.includes("developer") || text.includes("pull request") || text.includes("github")) {
    return "Voor coding-workflows is de test simpel: vergelijk niet alleen snelheid, maar ook reviewlast. Een AI-assistent die sneller code maakt maar meer controlewerk veroorzaakt, verschuift het werk in plaats van het op te lossen.";
  }
  if (text.includes("gemini") || text.includes("multimodal") || text.includes("voice")) {
    return "Praktisch is vooral interessant of dit nieuwe interacties mogelijk maakt: minder typen, meer context in beeld of geluid, en sneller schakelen tussen idee, prototype en uitleg.";
  }
  return "Mijn praktische lezing: behandel dit als iets om klein te testen. Eén afgebakende workflow, één duidelijke succesmaat, en pas daarna opnemen in je vaste gereedschap.";
}

function broaderContext(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("cost") || text.includes("pricing") || text.includes("token")) {
    return "Het bredere patroon is dat kosten bij AI steeds minder over losse tokens gaan en steeds meer over volledige taken. Bij agents telt de route: hoeveel pogingen zijn nodig, hoeveel context wordt meegesleept, en wanneer schakel je naar een sterker model?";
  }
  if (text.includes("open source") || text.includes("small model") || text.includes("local")) {
    return "Dit past in een grotere beweging richting lokale en kleinere modellen. Niet omdat ze altijd slimmer zijn, maar omdat controle, latency, privacy en kosten soms belangrijker zijn dan maximale benchmarkscore.";
  }
  if (text.includes("governance") || text.includes("safety") || text.includes("regulation")) {
    return "De grotere lijn is dat AI-governance langzaam verschuift van principes naar concrete operationele eisen: logging, rechten, evaluaties en herleidbaarheid.";
  }
  return "De rode draad is dat AI-nieuws pas echt relevant wordt wanneer het gedrag van tools verandert: wat kun je morgen anders doen dan gisteren?";
}

function sourceConfidence(story: StoryCluster) {
  const primaryCount = story.sources.filter((source) => source.kind === "primary").length;
  const secondaryCount = story.sources.length - primaryCount;
  if (primaryCount > 0 && secondaryCount > 0) {
    return "Qua betrouwbaarheid zit dit redelijk stevig: er is een directe bron en er is aanvullende duiding. De shownotes zijn daarom de moeite waard om even open te klikken.";
  }
  if (primaryCount > 0) {
    return "Qua betrouwbaarheid is dit controleerbaar aan de bron, maar de interpretatie is nog mijn redactionele lezing. Zeker bij papers is dat belangrijk: een claim in een abstract is nog geen praktijkbewijs.";
  }
  return "Qua betrouwbaarheid blijft dit voorzichtig: zonder primaire bron is het een signaal om te volgen, niet iets om al beleid of workflows op te baseren.";
}

function workTranslation(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const lines: string[] = [];

  if (text.includes("agent") || text.includes("workflow") || text.includes("tool")) {
    lines.push(
      "Voor AI-workflows betekent dit dat je agentgedrag meer als een proces moet ontwerpen dan als een losse prompt. Welke stap mag goedkoop en snel? Welke stap moet betrouwbaar zijn? En waar is een menselijke check goedkoper dan nog drie automatische retries?"
    );
  }

  if (text.includes("cost") || text.includes("token") || text.includes("routing")) {
    lines.push(
      "Voor kosteninschatting is de les vrij praktisch. Een workflow die op papier goedkoop lijkt, kan duur worden zodra fouten leiden tot herhaald proberen. Log daarom per taak hoeveel pogingen nodig zijn, welk model uiteindelijk het antwoord gaf, en hoeveel tokens onderweg zijn weggegooid."
    );
  }

  if (text.includes("coding") || text.includes("developer") || text.includes("github") || text.includes("codex")) {
    lines.push(
      "Voor software bouwen met AI kun je dit vertalen naar een simpele evaluatie: meet niet alleen of Codex of Claude Code een issue oplost, maar ook hoeveel herstelrondes nodig zijn. De echte productiviteitswinst zit vaak niet in de eerste generatie, maar in minder reparatie achteraf."
    );
  }

  if (text.includes("education") || text.includes("learning") || text.includes("skill")) {
    lines.push(
      "Voor onderwijs en AI-geletterdheid is dit een mooi voorbeeld van een volwassenere vraag: niet welk model is slim, maar welk systeemgedrag is betrouwbaar. Studenten en professionals moeten leren kijken naar proceskwaliteit, foutafhandeling en controleerbaarheid."
    );
  }

  if (lines.length === 0) {
    lines.push(
      "Voor jouw dagelijkse praktijk zou ik dit vooral gebruiken als lens: verandert dit de workflow, de kosten, de betrouwbaarheid of de manier waarop je iets uitlegt aan anderen? Als het antwoord nee is, is het waarschijnlijk geen podcastwaardige ontwikkeling."
    );
  }

  return lines.join(" ");
}

function concreteChecklist(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("agent") || text.includes("token") || text.includes("cost")) {
    return "Een klein experiment voor vandaag: pak één bestaande agent-achtige workflow, bijvoorbeeld research doen, code aanpassen of bronnen controleren. Noteer drie cijfers: hoeveel stappen doet de agent, hoeveel mislukte of halve pogingen zitten ertussen, en op welk punt zou jij willen escaleren naar een sterker model of naar jezelf. Dat geeft vaak sneller inzicht dan een benchmarktabel.";
  }
  if (text.includes("voice") || text.includes("multimodal") || text.includes("gemini")) {
    return "Een klein experiment voor vandaag: test dit niet als losse demo, maar in een echte taak. Bijvoorbeeld een presentatie voorbereiden, feedback verzamelen of een korte uitleg maken. Kijk of multimodaliteit werkelijk stappen wegneemt, of alleen een spectaculairdere interface oplevert.";
  }
  return "Een klein experiment voor vandaag: schrijf voor jezelf op welke beslissing je anders zou nemen als dit verhaal waar en belangrijk blijkt. Als daar niets concreets uitkomt, is het waarschijnlijk interessant nieuws maar geen actiepunt.";
}

export function buildEpisodeScript(stories: StoryCluster[], config: PodcastConfig, localDate: string) {
  const date = formatDutchDate(localDate);
  const intro =
    stories.length <= 2
      ? `Goedemorgen. Dit is AI Daily voor ${date}. Vandaag zijn er weinig harde, relevante AI-ontwikkelingen. Daarom geen losse headlinebrij, maar een korte deep-dive op wat wel de moeite waard is.`
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
      broaderContext(story),
      whyRelevant(story),
      workTranslation(story),
      practicalExperiment(story),
      concreteChecklist(story),
      sourceConfidence(story),
      criticalNote(story)
    ].join(" ");
  });

  const outro = stories.length <= 2
    ? "En dat is precies de selectie voor vandaag. Korter dan ideaal, maar liever één nuttige ontwikkeling met context dan tien minuten ruis. De bronlinks staan in de shownotes."
    : "Dat was de selectie voor vandaag. De bronlinks staan in de shownotes, zodat je de claims snel zelf kunt controleren.";
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

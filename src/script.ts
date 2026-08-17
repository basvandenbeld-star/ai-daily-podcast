import type { StoryCluster } from "./types.js";
import type { PodcastConfig } from "./config.js";
import { escapeHtml, forSpeech, normalizeText } from "./text.js";
import { formatDateForLanguage, formatDutchDate } from "./time.js";

function shortSummary(story: StoryCluster) {
  const text = normalizeText(story.summary || story.title)
    .replace(/^arXiv:\S+\s+Announce Type:\s+\w+\s+Abstract:\s*/i, "")
    .replace(/\\emph\{([^}]+)\}/g, "$1")
    .replace(/\s+/g, " ");
  if (text.length <= 820) return text;
  return `${text.slice(0, 817).replace(/\s+\S*$/, "")}...`;
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

function whyRelevantEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("codex") || text.includes("claude code") || text.includes("github") || text.includes("developer")) {
    return "For your work, the practical angle is the most important one: this may change how you use AI for building, debugging, and testing new workflows.";
  }
  if (text.includes("education") || text.includes("onderwijs") || text.includes("literacy")) {
    return "The useful question is how this translates into education and AI literacy: what should people be able to judge, and what can responsibly be automated?";
  }
  if (text.includes("model") || text.includes("benchmark") || text.includes("multimodal")) {
    return "The practical meaning depends on whether this opens up new capabilities, or whether it is mostly a benchmark story that still needs proof in everyday work.";
  }
  if (text.includes("governance") || text.includes("safety") || text.includes("regulation")) {
    return "The key point is what concretely changes in availability, obligations, or risk, not the governance language around it.";
  }
  return "The value is in the concrete change: what becomes easier, cheaper, more widely available, or less obvious than before?";
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

function criticalNoteEnglish(story: StoryCluster) {
  const hasPrimary = story.sources.some((source) => source.kind === "primary");
  if (!hasPrimary) {
    return "Caveat: I only see secondary reporting for this. Treat the details as context, not as final technical documentation.";
  }
  if (story.sources.length === 1) {
    return "Caveat: this is based on a primary source, but there is still little independent interpretation.";
  }
  return "The claim is reasonably checkable, because the show notes include a direct or primary source alongside the context.";
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

function practicalExperimentEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("agent") && (text.includes("cost") || text.includes("token") || text.includes("routing"))) {
    return "Concretely, you can use this as a check on your own agent workflows: measure not only the price of a single model call, but the total task price including retries, failed tool calls, and escalations to stronger models.";
  }
  if (text.includes("agent") && (text.includes("permission") || text.includes("local-first") || text.includes("runtime"))) {
    return "A useful experiment is to review your own local agent workflows through three questions: which tools can the agent use, which actions require explicit approval, and what logs do you need to understand the run afterwards?";
  }
  if (text.includes("coding") || text.includes("developer") || text.includes("pull request") || text.includes("github")) {
    return "For coding workflows, the test is simple: compare not only speed, but review burden. An AI assistant that writes faster but creates more checking work may just move the work around.";
  }
  if (text.includes("gemini") || text.includes("multimodal") || text.includes("voice")) {
    return "Practically, the interesting question is whether this enables new interactions: less typing, more visual or audio context, and faster movement from idea to prototype to explanation.";
  }
  return "My practical read: test this in a small, bounded workflow, with one clear success measure, before making it part of your default toolkit.";
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

function broaderContextEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("cost") || text.includes("pricing") || text.includes("token")) {
    return "The broader pattern is that AI costs are less and less about isolated tokens, and more about complete tasks. With agents, the route matters: how many attempts are needed, how much context is carried along, and when do you switch to a stronger model?";
  }
  if (text.includes("open source") || text.includes("small model") || text.includes("local")) {
    return "This fits a wider shift toward local and smaller models. Not because they are always smarter, but because control, latency, privacy, and cost sometimes matter more than maximum benchmark performance.";
  }
  if (text.includes("governance") || text.includes("safety") || text.includes("regulation")) {
    return "The bigger line is that AI governance is moving from principles toward operational requirements: logging, permissions, evaluations, and traceability.";
  }
  return "The red thread is that AI news becomes relevant only when tool behavior changes: what can you do differently tomorrow than yesterday?";
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

function concreteChecklistEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  if (text.includes("agent") || text.includes("token") || text.includes("cost")) {
    return "A small experiment for today: take one existing agent-like workflow, for example research, code changes, or source checking. Write down three numbers: how many steps the agent takes, how many failed or partial attempts happen along the way, and where you would escalate to a stronger model or to yourself. That often teaches more than a benchmark table.";
  }
  if (text.includes("voice") || text.includes("multimodal") || text.includes("gemini")) {
    return "A small experiment for today: test this inside a real task, not as a standalone demo. For example, prepare a presentation, collect feedback, or make a short explanation. Watch whether multimodality actually removes steps, or only creates a more impressive interface.";
  }
  return "A small experiment for today: write down what decision you would make differently if this story turns out to be true and important. If nothing concrete comes out, it is probably interesting news, but not an action item.";
}

function sparseDayDeepDiveEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const isAgent = text.includes("agent") || text.includes("workflow") || text.includes("tool");
  const isCoding = text.includes("coding") || text.includes("developer") || text.includes("github") || text.includes("codex") || text.includes("claude code");
  const isModel = text.includes("model") || text.includes("benchmark") || text.includes("multimodal") || text.includes("voice");
  const isPaper = story.sources.some((source) => source.sourceName.toLowerCase().includes("arxiv") || source.url.includes("arxiv.org"));

  const interpretation = isPaper
    ? "Because this is a research item, I would separate the useful idea from the level of proof. A paper can name a real problem before it gives you a production-ready answer. So the right response is not: copy the method tomorrow. The better response is: does this describe a failure mode I already see in my own work?"
    : "Because this is a product or ecosystem signal, I would separate the announced fact from the implied direction. The announcement tells you what exists now. The more interesting question is whether it changes the shape of the work around it: setup, maintenance, review, cost, or trust.";

  const workflow = isAgent
    ? "For agent workflows, the practical layer is especially important. Agents are rarely expensive or risky because of one single model response. They become expensive or risky because they loop, retry, call tools, keep too much context, or take action with too little certainty. That means the real design object is the full run: inputs, permissions, intermediate checks, logs, fallbacks, and the point where a human should take over."
    : isCoding
      ? "For AI coding, the practical layer is not just whether the assistant can produce code. The real question is whether it reduces the total cycle: understanding the issue, changing the right files, running the right tests, explaining the trade-offs, and leaving a diff that is easy to review. A faster first draft is useful only if it does not quietly increase the review debt."
      : isModel
        ? "For model and interface news, the practical layer is adoption friction. A model can be better on paper and still change very little if it is hard to access, slow in real tasks, too costly at scale, or awkward to fit into existing workflows. The test is whether it removes a step you currently feel, not whether the demo is impressive."
        : "For day-to-day work, the practical layer is workflow change. If this does not alter a decision, a tool choice, a teaching example, a client explanation, or the way you evaluate AI output, then it may be intellectually interesting but operationally small.";

  const critical = isPaper
    ? "What I would not conclude yet: that this is settled evidence for one specific vendor, model, or implementation. With papers, the danger is treating a narrow setup as a universal rule. The value is often in the framing: it gives you a better question to ask when you evaluate your own tools."
    : "What I would not conclude yet: that every claim around this will survive contact with daily use. AI releases often sound larger at launch than they feel after a week of real work. The sensible stance is interested, but empirical: test the narrow use case that matters to you.";

  const experiment = isAgent || isCoding
    ? "A concrete test would be to choose one real task from your week and run it twice. Once with your current workflow, once with the new idea in mind. Time the full cycle, including checking, fixing, and documenting. Then ask one blunt question: did this reduce cognitive load, or did it just move the effort into review?"
    : "A concrete test would be to pick one real communication or education task: explain a concept, prepare a short session, make a prototype, or compare sources. Then watch where the new capability helps. Does it make the first version better, make iteration faster, or make the result easier to trust?";

  const watch = "The signal to watch next is not another announcement. It is repeatable use. Look for examples where people show the full workflow, including mistakes and constraints. Also watch whether the idea appears in documentation, pricing, SDKs, integrations, or classroom practice. That is usually where AI news moves from interesting to actually useful.";

  return [interpretation, workflow, critical, experiment, watch].join(" ");
}

function singleStoryExtraLayerEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const isAgent = text.includes("agent") || text.includes("workflow") || text.includes("tool");
  const isCoding = text.includes("coding") || text.includes("developer") || text.includes("github") || text.includes("codex") || text.includes("claude code");
  const isEducation = text.includes("education") || text.includes("learning") || text.includes("literacy") || text.includes("classroom");

  const communication = isEducation
    ? "For education, the useful teaching angle is judgment. I would not turn this into a lesson about one tool. I would turn it into a lesson about how you inspect an AI system: what input it received, what it tried, where it failed, what evidence supports the output, and where a human still needs to decide."
    : "For communication and coaching, the useful angle is how to explain the difference between a capability and a workflow. People often ask whether a model can do something. The sharper question is whether the surrounding process makes the result dependable enough for the context: a class, a client, a publication, or a software change.";

  const implementation = isAgent || isCoding
    ? "If you want to turn this into something operational, I would start with a small evaluation harness. Pick five representative tasks, keep the inputs stable, and record the full run: prompts, tool calls, retries, model switches, time spent, failures, and human interventions. That gives you a much better signal than a single impressive demo. Especially with coding agents, the best metric is not lines generated. It is the number of review questions that disappear."
    : "If you want to turn this into something operational, I would start with a repeatable comparison. Pick a task you already do, define what good looks like, and run the old and new workflow side by side. Keep the scoring simple: time saved, quality of first draft, amount of correction needed, and confidence in the final result.";

  const boundary = "The boundary to keep in mind is that today's item is a signal, not a mandate. It earns attention because it points at a real direction in AI work. It does not earn automatic adoption. The practical move is to convert the news into one small test, one note for your mental model, and maybe one example you can use when explaining AI maturity to others. Tomorrow, the useful follow-up question is simple: did this change how you judged a workflow, or did it only give you another interesting thing to mention?";

  return [communication, implementation, boundary].join(" ");
}

function sparseDayDeepDiveDutch(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const isAgent = text.includes("agent") || text.includes("workflow") || text.includes("tool");
  const isCoding = text.includes("coding") || text.includes("developer") || text.includes("github") || text.includes("codex") || text.includes("claude code");
  const isModel = text.includes("model") || text.includes("benchmark") || text.includes("multimodal") || text.includes("voice");
  const isPaper = story.sources.some((source) => source.sourceName.toLowerCase().includes("arxiv") || source.url.includes("arxiv.org"));

  const interpretation = isPaper
    ? "Omdat dit een research-item is, zou ik het idee scheiden van het bewijsniveau. Een paper kan een echt probleem scherp benoemen zonder dat de oplossing morgen productierijp is. De vraag is dus niet: moet je deze methode meteen kopieren? De betere vraag is: beschrijft dit een foutmodus die je al in je eigen werk ziet?"
    : "Omdat dit een product- of ecosysteemsignaal is, zou ik het feit scheiden van de richting. De aankondiging vertelt wat er nu bestaat. Interessanter is of het werk eromheen verandert: setup, onderhoud, controle, kosten of vertrouwen.";

  const workflow = isAgent
    ? "Voor agent-workflows is die praktische laag extra belangrijk. Agents zijn zelden duur of riskant door een enkel modelantwoord. Ze worden duur of riskant doordat ze loopen, opnieuw proberen, tools aanroepen, te veel context meeslepen of handelen met te weinig zekerheid. Het echte ontwerpobject is dus de volledige run: input, rechten, tussenchecks, logs, fallback en het moment waarop een mens moet overnemen."
    : isCoding
      ? "Voor AI-coding gaat het niet alleen om de vraag of de assistent code kan maken. De echte vraag is of de totale cyclus korter wordt: issue begrijpen, de juiste bestanden aanpassen, de juiste tests draaien, keuzes uitleggen en een diff achterlaten die makkelijk te reviewen is. Een snelle eerste versie is pas waardevol als de reviewlast niet stilletjes groeit."
      : isModel
        ? "Bij model- en interfacenieuws zit de praktische vraag in adoptiefrictie. Een model kan op papier beter zijn en toch weinig veranderen als toegang lastig is, taken traag zijn, kosten oplopen of de integratie niet in bestaande workflows past. De test is of het een stap wegneemt die je nu echt voelt."
        : "Voor dagelijks werk draait de praktische laag om workflowverandering. Als dit geen beslissing, toolkeuze, onderwijsvoorbeeld, klantuitleg of evaluatie van AI-output verandert, is het misschien interessant maar operationeel klein.";

  const critical = isPaper
    ? "Wat ik hier nog niet uit zou concluderen: dat dit hard bewijs is voor een specifieke leverancier, modelkeuze of implementatie. Bij papers is het risico dat je een smalle onderzoeksopzet te snel als algemene regel behandelt. De waarde zit vaak in de betere vraag die je ermee aan je eigen tools kunt stellen."
    : "Wat ik hier nog niet uit zou concluderen: dat alle claims overeind blijven in dagelijks gebruik. AI-releases klinken bij lancering vaak groter dan ze na een week werk voelen. De verstandige houding is nieuwsgierig maar empirisch: test de kleine toepassing die voor jou telt.";

  const experiment = isAgent || isCoding
    ? "Een concrete test is om een echte taak uit je week twee keer te doen. Een keer met je huidige workflow, een keer met dit idee in je achterhoofd. Meet de hele cyclus, inclusief controleren, herstellen en documenteren. Stel daarna de botte vraag: verlaagde dit de cognitieve belasting, of verschoof het werk vooral naar review?"
    : "Een concrete test is om een echte communicatie- of onderwijstaak te pakken: een concept uitleggen, een korte sessie voorbereiden, een prototype maken of bronnen vergelijken. Kijk waar de nieuwe mogelijkheid helpt. Wordt de eerste versie beter, itereren sneller, of het resultaat makkelijker te vertrouwen?";

  const watch = "Het signaal om nu te volgen is niet de volgende aankondiging, maar herhaalbaar gebruik. Let op voorbeelden waarin mensen de volledige workflow laten zien, inclusief fouten en beperkingen. Kijk ook of het idee opduikt in documentatie, prijzen, SDKs, integraties of onderwijspraktijk. Daar verschuift AI-nieuws meestal van interessant naar werkelijk bruikbaar.";

  return [interpretation, workflow, critical, experiment, watch].join(" ");
}

function singleStoryExtraLayerDutch(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const isAgent = text.includes("agent") || text.includes("workflow") || text.includes("tool");
  const isCoding = text.includes("coding") || text.includes("developer") || text.includes("github") || text.includes("codex") || text.includes("claude code");
  const isEducation = text.includes("education") || text.includes("learning") || text.includes("literacy") || text.includes("classroom");

  const communication = isEducation
    ? "Voor onderwijs is de nuttige invalshoek beoordelingsvermogen. Ik zou dit niet gebruiken als les over een tool, maar als les over hoe je een AI-systeem inspecteert: welke input kreeg het, wat probeerde het, waar ging het mis, welk bewijs ondersteunt de output en waar moet een mens blijven beslissen?"
    : "Voor communicatie en coaching is de nuttige invalshoek het verschil tussen een mogelijkheid en een workflow. Mensen vragen vaak of een model iets kan. De scherpere vraag is of het proces eromheen het resultaat betrouwbaar genoeg maakt voor de context: een les, een klant, een publicatie of een softwarewijziging.";

  const implementation = isAgent || isCoding
    ? "Als je dit operationeel wilt maken, zou ik beginnen met een klein evaluatiesetje. Kies vijf representatieve taken, houd de input stabiel en leg de volledige run vast: prompts, toolcalls, retries, modelwissels, tijd, fouten en menselijke interventies. Dat geeft veel meer signaal dan een enkele indrukwekkende demo. Zeker bij coding agents is de beste maatstaf niet hoeveel regels code verschijnen, maar hoeveel reviewvragen verdwijnen."
    : "Als je dit operationeel wilt maken, zou ik beginnen met een herhaalbare vergelijking. Pak een taak die je toch al doet, definieer wat goed genoeg is en draai de oude en nieuwe workflow naast elkaar. Houd de score simpel: tijdwinst, kwaliteit van de eerste versie, hoeveelheid correctiewerk en vertrouwen in het eindresultaat.";

  const boundary = "De grens om te onthouden: het item van vandaag is een signaal, geen opdracht. Het verdient aandacht omdat het een echte richting in AI-werk aanwijst. Het verdient nog geen automatische adoptie. De praktische stap is om het nieuws om te zetten in een kleine test, een notitie voor je mentale model en misschien een voorbeeld dat je kunt gebruiken wanneer je AI-volwassenheid aan anderen uitlegt. Morgen is de nuttige vervolgvraag simpel: veranderde dit hoe je een workflow beoordeelde, of gaf het alleen een interessant punt om te noemen?";

  return [communication, implementation, boundary].join(" ");
}

function buildEnglishEpisodeScript(stories: StoryCluster[], config: PodcastConfig, localDate: string) {
  const date = formatDateForLanguage(localDate, config.language);
  const intro =
    stories.length <= 2
      ? `Good morning. This is AI Daily for ${date}. Today there are only a few hard, relevant AI developments, so no pile of loose headlines. I will do a focused analysis of what is actually worth your attention.`
      : `Good morning. This is AI Daily for ${date}. Here are the most important AI developments from the last day, with a focus on what changes in practice.`;

  const shouldDeepDive = stories.length <= 2;
  const parts = stories.map((story, index) => {
    const sourcePhrase =
      story.sourceNames.length === 1
        ? `The source is ${story.sourceNames[0]}.`
        : `I see this reflected by ${story.sourceNames.slice(0, 3).join(", ")}.`;
    return [
      `${index + 1}. ${story.title}.`,
      `What happened: ${shortSummary(story)}`,
      sourcePhrase,
      broaderContextEnglish(story),
      whyRelevantEnglish(story),
      workTranslationEnglish(story),
      practicalExperimentEnglish(story),
      concreteChecklistEnglish(story),
      ...(shouldDeepDive ? [sparseDayDeepDiveEnglish(story)] : []),
      ...(stories.length === 1 ? [singleStoryExtraLayerEnglish(story)] : []),
      sourceConfidenceEnglish(story),
      criticalNoteEnglish(story)
    ].join(" ");
  });

  const outro = stories.length <= 2
    ? "That is the selection for today. A quieter news day, but still useful when treated as analysis rather than filler. The source links are in the show notes."
    : "That was today's selection. The source links are in the show notes, so you can quickly check the claims yourself.";
  const script = [intro, ...parts, outro].join("\n\n");

  const estimatedMinutes = script.split(/\s+/).length / config.tts.wordsPerMinute;
  return {
    script: forSpeech(script, config.language),
    rawScript: script,
    estimatedMinutes
  };
}

function sourceConfidenceEnglish(story: StoryCluster) {
  const primaryCount = story.sources.filter((source) => source.kind === "primary").length;
  const secondaryCount = story.sources.length - primaryCount;
  if (primaryCount > 0 && secondaryCount > 0) {
    return "In terms of confidence, this is fairly solid: there is a direct source and additional interpretation. The show notes are worth opening.";
  }
  if (primaryCount > 0) {
    return "In terms of confidence, this is checkable at the source, but the interpretation is still my editorial read. That matters especially with papers: a claim in an abstract is not yet real-world proof.";
  }
  return "In terms of confidence, stay careful: without a primary source, this is a signal to watch, not something to build policy or workflows on yet.";
}

function workTranslationEnglish(story: StoryCluster) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const lines: string[] = [];

  if (text.includes("agent") || text.includes("workflow") || text.includes("tool")) {
    lines.push(
      "For AI workflows, this means agent behavior should be designed more like a process than a single prompt. Which step can be cheap and fast? Which step must be reliable? And where is a human check cheaper than three more automatic retries?"
    );
  }

  if (text.includes("cost") || text.includes("token") || text.includes("routing")) {
    lines.push(
      "For cost estimation, the lesson is practical. A workflow that looks cheap on paper can become expensive once errors trigger repeated attempts. Log the number of attempts per task, which model eventually solved it, and how many tokens were effectively thrown away."
    );
  }

  if (text.includes("coding") || text.includes("developer") || text.includes("github") || text.includes("codex")) {
    lines.push(
      "For building software with AI, translate this into a simple evaluation: do not only measure whether Codex or Claude Code solves an issue, but how many repair rounds it needs. The real productivity gain is often not the first generation, but less cleanup afterwards."
    );
  }

  if (text.includes("education") || text.includes("learning") || text.includes("skill")) {
    lines.push(
      "For education and AI literacy, this is a good example of a more mature question: not which model is smart, but which system behavior is reliable. Professionals need to learn to look at process quality, error handling, and auditability."
    );
  }

  if (lines.length === 0) {
    lines.push(
      "For your daily practice, I would mainly use this as a filter: does it change the workflow, the cost, the reliability, or the way you explain something to others? If not, it is probably not podcast-worthy."
    );
  }

  return lines.join(" ");
}

export function buildEpisodeScript(stories: StoryCluster[], config: PodcastConfig, localDate: string) {
  if (config.language.toLowerCase().startsWith("en")) {
    return buildEnglishEpisodeScript(stories, config, localDate);
  }

  const date = formatDutchDate(localDate);
  const intro =
    stories.length <= 2
      ? `Goedemorgen. Dit is AI Daily voor ${date}. Vandaag zijn er weinig harde, relevante AI-ontwikkelingen. Daarom geen losse headlinebrij, maar een gerichte analyse van wat wel de moeite waard is.`
      : `Goedemorgen. Dit is AI Daily voor ${date}. Dit zijn de belangrijkste AI-ontwikkelingen van de afgelopen dag, met vooral aandacht voor wat praktisch verandert.`;

  const shouldDeepDive = stories.length <= 2;
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
      ...(shouldDeepDive ? [sparseDayDeepDiveDutch(story)] : []),
      ...(stories.length === 1 ? [singleStoryExtraLayerDutch(story)] : []),
      sourceConfidence(story),
      criticalNote(story)
    ].join(" ");
  });

  const outro = stories.length <= 2
    ? "En dat is de selectie voor vandaag. Een rustige nieuwsdag, maar nog steeds bruikbaar wanneer je hem behandelt als analyse in plaats van vulling. De bronlinks staan in de shownotes."
    : "Dat was de selectie voor vandaag. De bronlinks staan in de shownotes, zodat je de claims snel zelf kunt controleren.";
  const script = [intro, ...parts, outro].join("\n\n");

  const estimatedMinutes = script.split(/\s+/).length / config.tts.wordsPerMinute;
  return {
    script: forSpeech(script, config.language),
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

import fs from "node:fs/promises";
import path from "node:path";
import { synthesizeMacSpeech, synthesizePiperSpeech } from "../src/audio.js";
import { readPodcastConfig } from "../src/config.js";

const config = await readPodcastConfig();
const fragment =
  "Dit is een korte test voor de persoonlijke AI nieuwspodcast. OpenAI, Claude Code, Gemini, Vercel AI SDK en lokale agents moeten duidelijk verstaanbaar blijven, ook tijdens een autorit.";
const voices = [config.tts.voice, ...config.tts.fallbackVoices].slice(0, 2);
const outDir = path.resolve("samples");
await fs.mkdir(outDir, { recursive: true });

const results = [];
for (const voice of voices) {
  const file = path.join(outDir, `tts-${voice.toLowerCase()}.mp3`);
  const audio = await synthesizeMacSpeech({
    text: fragment,
    voice,
    speechRate: config.tts.speechRate,
    outputMp3: file
  });
  results.push({ voice, file, ...audio });
}

if (config.tts.piperModelPath && config.tts.piperConfigPath) {
  const piperFile = path.join(outDir, "tts-piper-nl_NL-mls-medium.mp3");
  const audio = await synthesizePiperSpeech({
    text: fragment,
    modelPath: config.tts.piperModelPath,
    configPath: config.tts.piperConfigPath,
    outputMp3: piperFile
  });
  results.push({ voice: "Piper nl_NL mls medium", file: piperFile, ...audio });
}

const report = `# Lokale TTS vergelijking

Fragment:

${fragment}

Geteste stemmen:

${results.map((item) => `- ${item.voice}: ${item.file} (${item.durationSeconds}s, ${item.bytes} bytes)`).join("\n")}

Voorlopige keuze in configuratie: ${config.tts.engine === "piper" ? "Piper nl_NL mls medium" : config.tts.voice}.

Beoordelingscriteria voor de definitieve keuze:

- Verstaanbaarheid van Nederlands.
- Natuurlijkheid bij 7 tot 10 minuten luisteren.
- Uitspraak van Engelse AI-termen zoals OpenAI, Claude Code, Gemini, Vercel AI SDK en agents.
- Rustig genoeg voor telefoon en auto.

Opmerking: Kokoro is onderzocht maar de gangbare open-source CLI ondersteunt momenteel geen Nederlandse stemmen. Piper ondersteunt Nederlands en is nu als gratis lokale engine toegevoegd. Coqui XTTS v2 klinkt vaak natuurlijker, maar de modellicentie is non-commercial en valt daarom buiten de harde eis voor een vrije, accountloze engine.
`;
await fs.writeFile(path.join(outDir, "tts-evaluation.md"), report, "utf8");
console.log(JSON.stringify(results, null, 2));

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseFile } from "music-metadata";

function run(command: string, args: string[], input?: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

export async function synthesizeMacSpeech(options: {
  text: string;
  voice: string;
  speechRate: number;
  outputMp3: string;
}) {
  await fs.mkdir(path.dirname(options.outputMp3), { recursive: true });
  const tempAiff = `${options.outputMp3}.aiff`;
  const tempMp3 = `${options.outputMp3}.tmp.mp3`;

  try {
    await run("say", ["-v", options.voice, "-r", String(options.speechRate), "-o", tempAiff], options.text);
    await run("ffmpeg", [
      "-y",
      "-i",
      tempAiff,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "44100",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "96k",
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      tempMp3
    ]);
    await fs.rename(tempMp3, options.outputMp3);
  } finally {
    await fs.rm(tempAiff, { force: true });
    await fs.rm(tempMp3, { force: true });
  }

  const metadata = await parseFile(options.outputMp3);
  const stat = await fs.stat(options.outputMp3);
  return {
    durationSeconds: Math.round(metadata.format.duration ?? 0),
    bytes: stat.size
  };
}

export async function synthesizePiperSpeech(options: {
  text: string;
  modelPath: string;
  configPath: string;
  outputMp3: string;
}) {
  await fs.mkdir(path.dirname(options.outputMp3), { recursive: true });
  const tempWav = `${options.outputMp3}.wav`;
  const tempMp3 = `${options.outputMp3}.tmp.mp3`;

  try {
    await run("piper", [
      "--model",
      options.modelPath,
      "--config",
      options.configPath,
      "--output_file",
      tempWav
    ], options.text);
    await run("ffmpeg", [
      "-y",
      "-i",
      tempWav,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "44100",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "96k",
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      tempMp3
    ]);
    await fs.rename(tempMp3, options.outputMp3);
  } finally {
    await fs.rm(tempWav, { force: true });
    await fs.rm(tempMp3, { force: true });
  }

  const metadata = await parseFile(options.outputMp3);
  const stat = await fs.stat(options.outputMp3);
  return {
    durationSeconds: Math.round(metadata.format.duration ?? 0),
    bytes: stat.size
  };
}

export async function synthesizeSpeech(options: {
  engine: "macos-say" | "piper";
  text: string;
  voice: string;
  speechRate: number;
  piperModelPath?: string;
  piperConfigPath?: string;
  outputMp3: string;
}) {
  if (options.engine === "piper") {
    if (!options.piperModelPath || !options.piperConfigPath) {
      throw new Error("Piper requires piperModelPath and piperConfigPath.");
    }
    return synthesizePiperSpeech({
      text: options.text,
      modelPath: options.piperModelPath,
      configPath: options.piperConfigPath,
      outputMp3: options.outputMp3
    });
  }

  return synthesizeMacSpeech({
    text: options.text,
    voice: options.voice,
    speechRate: options.speechRate,
    outputMp3: options.outputMp3
  });
}

export async function assertAudioValid(file: string, maxDurationSeconds: number) {
  const metadata = await parseFile(file);
  const duration = metadata.format.duration ?? 0;
  if (!Number.isFinite(duration) || duration <= 5) {
    throw new Error(`Audio validation failed: duration is ${duration}`);
  }
  if (duration > maxDurationSeconds) {
    throw new Error(`Audio validation failed: ${Math.round(duration)}s exceeds ${maxDurationSeconds}s`);
  }
  const stat = await fs.stat(file);
  if (stat.size < 10_000) throw new Error(`Audio validation failed: file too small (${stat.size} bytes)`);
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

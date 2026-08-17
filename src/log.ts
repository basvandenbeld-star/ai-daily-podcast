import fs from "node:fs/promises";
import path from "node:path";

export async function logEvent(dataDir: string, event: Record<string, unknown>) {
  await fs.mkdir(path.resolve(dataDir, "logs"), { recursive: true });
  const line = JSON.stringify({ time: new Date().toISOString(), ...event }) + "\n";
  await fs.appendFile(path.resolve(dataDir, "logs", "podcast.log"), line, "utf8");
}

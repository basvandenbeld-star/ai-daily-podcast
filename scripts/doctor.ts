import { spawnSync } from "node:child_process";
import { loadEnvFile } from "../src/env-file.js";
import { readPodcastConfig } from "../src/config.js";

loadEnvFile();
const config = await readPodcastConfig();
const checks = [
  ["node", ["--version"]],
  ["npm", ["--version"]],
  ["ffmpeg", ["-version"]],
  ["say", ["-v", "?"]],
  ["git", ["--version"]]
] as const;

for (const [command, args] of checks) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  console.log(`${command}: ${result.status === 0 ? "ok" : "missing"}`);
}

for (const name of [config.feedTokenEnv, config.publicBaseUrlEnv]) {
  console.log(`${name}: ${process.env[name] ? "set" : "missing"}`);
}

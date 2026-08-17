import { loadEnvFile } from "../src/env-file.js";
import { generateEpisode } from "../src/workflow.js";

loadEnvFile();

const force = process.argv.includes("--force");

try {
  const result = await generateEpisode({ force });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

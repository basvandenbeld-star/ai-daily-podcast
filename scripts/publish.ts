import { spawnSync } from "node:child_process";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`);
}

const message = `Publish AI Daily ${new Date().toISOString().slice(0, 10)}`;
const remote = spawnSync("git", ["remote"], { encoding: "utf8" });
if (!remote.stdout.trim()) {
  console.log("No Git remote configured; skipping publish.");
  process.exit(0);
}
run("git", ["add", "docs"]);
const diff = spawnSync("git", ["diff", "--cached", "--quiet"]);
if (diff.status === 0) {
  console.log("No publish changes.");
  process.exit(0);
}
run("git", ["commit", "-m", message]);
run("git", ["push"]);

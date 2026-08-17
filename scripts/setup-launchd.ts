import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const label = "local.ai-daily-podcast";
const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${label}.plist`);
const supportDir = path.join(os.homedir(), "Library", "Application Support", "AI Daily Podcast");
const logDir = path.join(os.homedir(), "Library", "Logs", "AI Daily Podcast");
const runner = path.join(supportDir, "run-daily.sh");
const npmPath = process.env.npm_execpath?.endsWith("npm-cli.js") ? "/usr/local/bin/npm" : "/usr/local/bin/npm";

await fs.mkdir(path.dirname(plistPath), { recursive: true });
await fs.mkdir(supportDir, { recursive: true });
await fs.mkdir(logDir, { recursive: true });
await fs.mkdir(path.join(cwd, ".data", "logs"), { recursive: true });

await fs.writeFile(
  runner,
  `#!/bin/bash
set -euo pipefail
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "${cwd}"
"${npmPath}" run generate
"${npmPath}" run publish || true
`,
  { mode: 0o755 }
);

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${runner}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${os.homedir()}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>6</integer>
    <key>Minute</key>
    <integer>15</integer>
  </dict>
  <key>StartInterval</key>
  <integer>3600</integer>
  <key>StandardOutPath</key>
  <string>${path.join(logDir, "launchd.out.log")}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(logDir, "launchd.err.log")}</string>
</dict>
</plist>
`;

await fs.writeFile(plistPath, plist, "utf8");
spawnSync("launchctl", ["unload", plistPath], { stdio: "ignore" });
const result = spawnSync("launchctl", ["load", plistPath], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Installed ${plistPath}`);

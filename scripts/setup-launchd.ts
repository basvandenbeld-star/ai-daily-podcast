import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const label = "local.ai-daily-podcast";
const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${label}.plist`);
const runner = path.join(cwd, "bin", "run-daily.sh");

await fs.mkdir(path.dirname(plistPath), { recursive: true });
await fs.mkdir(path.join(cwd, "bin"), { recursive: true });
await fs.mkdir(path.join(cwd, ".data", "logs"), { recursive: true });

await fs.writeFile(
  runner,
  `#!/bin/bash
set -euo pipefail
cd "${cwd}"
/usr/bin/env npm run generate
/usr/bin/env npm run publish || true
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
    <string>${runner}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${cwd}</string>
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
  <string>${path.join(cwd, ".data", "logs", "launchd.out.log")}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(cwd, ".data", "logs", "launchd.err.log")}</string>
</dict>
</plist>
`;

await fs.writeFile(plistPath, plist, "utf8");
spawnSync("launchctl", ["unload", plistPath], { stdio: "ignore" });
const result = spawnSync("launchctl", ["load", plistPath], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Installed ${plistPath}`);

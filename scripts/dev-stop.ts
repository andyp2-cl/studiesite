// Stops every `next dev` process for this project – also ones left running
// after a PowerShell window was closed or Ctrl+C did not work. Other node
// programs are left alone. Windows only.
// Usage: npm run dev:stop   (or: npm run dev:restart)

import { execFileSync } from "node:child_process";
import path from "node:path";

const project = path.resolve(".");

// node.exe processes whose command line points into this project and runs Next.js.
const list = execFileSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId)`t$($_.CommandLine)\" }",
  ],
  { encoding: "utf8" },
);

const ids = list
  .split(/\r?\n/)
  .map((line) => line.split("\t"))
  .filter(([id, cmd]) => id && cmd && cmd.toLowerCase().includes(project.toLowerCase()) && /next|turbopack/.test(cmd))
  .map(([id]) => Number(id))
  .filter((id) => id !== process.pid && id !== process.ppid);

if (ids.length === 0) {
  console.log("Ingen dev-server för Studiesite körs.");
} else {
  for (const id of ids) {
    try {
      process.kill(id);
    } catch {
      // Already gone (stopping a parent can take its children with it).
    }
  }
  console.log(`Stoppade ${ids.length} process(er) för Studiesite.`);
}

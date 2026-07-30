import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const services = [
  { name: "api", cwd: "apps/api", url: "http://localhost:4000" },
  { name: "web", cwd: "apps/web", url: "http://localhost:3000" },
  { name: "dashboard", cwd: "apps/dashboard", url: "http://localhost:3001" },
];

const command = process.platform === "win32" ? "bun.exe" : "bun";
const children = [];
let shuttingDown = false;

function prefixStream(stream, name) {
  const lines = createInterface({ input: stream });
  lines.on("line", (line) => {
    console.log(`[${name}] ${line}`);
  });
}

for (const service of services) {
  const child = spawn(command, ["run", "dev"], {
    cwd: new URL(`../${service.cwd}/`, import.meta.url),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.push(child);
  prefixStream(child.stdout, service.name);
  prefixStream(child.stderr, service.name);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (code === 0 || signal) return;

    console.error(`[${service.name}] exited with code ${code}`);
    shutdown(1);
  });
}

console.log("Passway dev servers starting:");
for (const service of services) {
  console.log(`- ${service.name}: ${service.url}`);
}

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

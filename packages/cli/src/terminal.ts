import readline from "node:readline";

const enabled = !process.env.NO_COLOR && process.stdout.isTTY;
const color = (code: number) => (text: string) => enabled ? `\u001b[${code}m${text}\u001b[0m` : text;

export const cyan = color(36);
export const green = color(32);
export const yellow = color(33);
export const red = color(31);
export const dim = color(90);
export const bold = color(1);

export function clearScreen() {
  if (process.stdout.isTTY) process.stdout.write("\u001b[2J\u001b[H");
}

export function write(value = "") {
  process.stdout.write(`${value}\n`);
}

export function ask(label: string) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) => prompt.question(`${label} `, (answer) => {
    prompt.close();
    resolve(answer.trim());
  }));
}

export function secret(label = "Master password:") {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("A secure interactive terminal is required for password input.");
  }
  process.stdout.write(`${label} `);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

export function confirm(label: string) {
  return ask(`${label} ${yellow("[y/N]")}`).then((answer) => answer.toLowerCase() === "y");
}

export function readKey() {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) return ask("Select ›");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise<string>((resolve) => {
    const onData = (key: string) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(key);
    };
    process.stdin.on("data", onData);
  });
}

function visibleLength(value: string) {
  return value.replace(/\u001b\[[0-9;]*m/g, "").length;
}

function fit(value: string, width: number) {
  const plainLength = visibleLength(value);
  if (plainLength <= width) return `${value}${" ".repeat(width - plainLength)}`;
  return `${value.replace(/\u001b\[[0-9;]*m/g, "").slice(0, Math.max(0, width - 1))}…`;
}

export function frame(title: string, lines: string[]) {
  const width = Math.max(30, Math.min(52, (process.stdout.columns ?? 54) - 2));
  const inner = width - 2;
  const heading = `─ ${title} `;
  const top = `┌${heading}${"─".repeat(Math.max(0, inner - heading.length))}┐`;
  return [top, ...lines.map((line) => `│${fit(` ${line}`, inner)}│`), `└${"─".repeat(inner)}┘`].join("\n");
}

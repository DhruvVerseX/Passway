import { spawn, spawnSync } from "node:child_process";

export const CLIPBOARD_SECONDS = 30;

function clipboardCommand() {
  if (process.platform === "win32") return { command: "clip.exe", args: [] };
  if (process.platform === "darwin") return { command: "pbcopy", args: [] };
  return { command: "xclip", args: ["-selection", "clipboard"] };
}

function clearLater() {
  const script = `
const { spawnSync } = require("node:child_process");
const command = process.platform === "win32" ? "clip.exe" : process.platform === "darwin" ? "pbcopy" : "xclip";
const args = process.platform === "linux" ? ["-selection", "clipboard"] : [];
setTimeout(() => spawnSync(command, args, { input: "", shell: false, windowsHide: true }), ${CLIPBOARD_SECONDS * 1000});
`;
  spawn(process.execPath, ["-e", script], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    shell: false,
  }).unref();
}

export function clearClipboard() {
  const { command, args } = clipboardCommand();
  return spawnSync(command, args, { input: "", shell: false, windowsHide: true }).status === 0;
}

export function copyPassword(value: string) {
  const { command, args } = clipboardCommand();
  const copied = spawnSync(command, args, { input: value, shell: false, windowsHide: true });
  if (copied.status !== 0) return false;
  clearLater();
  return true;
}

import { spawn, spawnSync } from "node:child_process";

export const CLIPBOARD_SECONDS = 30;

export function clearClipboard() {
  if (process.platform === "win32") {
    return spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard -Value ''"], { windowsHide: true }).status === 0;
  }
  const command = process.platform === "darwin" ? "pbcopy" : "xclip";
  const args = process.platform === "darwin" ? [] : ["-selection", "clipboard"];
  return spawnSync(command, args, { input: "" }).status === 0;
}

export function copyPassword(value: string) {
  if (process.platform === "win32") {
    const copied = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "$input | Set-Clipboard"], {
      input: value,
      windowsHide: true,
    });
    if (copied.status !== 0) return false;
    spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Start-Sleep -Seconds ${CLIPBOARD_SECONDS}; Set-Clipboard -Value ''`], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    return true;
  }

  const command = process.platform === "darwin" ? "pbcopy" : "xclip";
  const args = process.platform === "darwin" ? [] : ["-selection", "clipboard"];
  const copied = spawnSync(command, args, { input: value });
  if (copied.status !== 0) return false;
  const clear = process.platform === "darwin" ? "sleep 30; printf '' | pbcopy" : "sleep 30; printf '' | xclip -selection clipboard";
  spawn("sh", ["-c", clear], { detached: true, stdio: "ignore" }).unref();
  return true;
}

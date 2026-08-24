import type { RuntimeSecrets } from "./api.js";

const WINDOWS_COMMAND_SHIMS = new Set(["npm", "npx", "pnpm", "yarn"]);

export function childEnvironment(
  parent: NodeJS.ProcessEnv,
  secrets: RuntimeSecrets,
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...parent, ...secrets };
  delete environment.PASSWAY_TOKEN;
  return environment;
}

export function executableForPlatform(
  command: string,
  platform = process.platform,
) {
  if (platform === "win32" && WINDOWS_COMMAND_SHIMS.has(command)) {
    return `${command}.cmd`;
  }
  return command;
}

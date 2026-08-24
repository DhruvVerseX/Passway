#!/usr/bin/env bun
import { spawn } from "node:child_process";
import { fetchRuntimeSecrets, fetchRuntimeStatus } from "./api.js";
import {
  apiBaseUrl,
  findAppId,
  findRuntimeToken,
  hasValidLocalTokenFormat,
} from "./config.js";
import {
  printConnectionFailure,
  printInvalidToken,
  printMissingApp,
  printMissingToken,
  printSecretFailure,
  printSuccess,
} from "./output.js";
import { runPasswordManager } from "./password-manager.js";
import { childEnvironment, executableForPlatform } from "./runtime.js";

async function start(command?: string, args: string[] = []) {
  const token = await findRuntimeToken();
  if (!token) {
    printMissingToken();
    return 1;
  }
  if (!hasValidLocalTokenFormat(token)) {
    printInvalidToken();
    return 1;
  }
  const appId = await findAppId();
  if (!appId) {
    printMissingApp();
    return 1;
  }

  const baseUrl = apiBaseUrl();
  const result = await fetchRuntimeStatus(baseUrl, token, appId);
  if (result.kind !== "success") {
    printConnectionFailure(result);
    return 1;
  }

  const secrets = await fetchRuntimeSecrets(baseUrl, token, appId);
  if (secrets.kind !== "success") {
    printSecretFailure(secrets);
    return 1;
  }

  if (!command) {
    printSuccess(result.status);
    return 0;
  }

  const child = spawn(executableForPlatform(command), args, {
    cwd: process.cwd(),
    env: childEnvironment(process.env, secrets.secrets),
    stdio: "inherit",
    shell: false,
  });

  return await new Promise<number>((resolve) => {
    child.once("error", () => resolve(1));
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

if (process.argv[2] === "start") {
  const commandIndex = process.argv[3] === "--" ? 4 : 3;
  process.exitCode = await start(
    process.argv[commandIndex],
    process.argv.slice(commandIndex + 1),
  );
} else {
  process.exitCode = await runPasswordManager(
    process.argv[2],
    process.argv.slice(3),
  );
}

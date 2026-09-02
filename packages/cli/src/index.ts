#!/usr/bin/env bun
import { spawn } from "node:child_process";
import { fetchRuntimeSecrets, fetchRuntimeStatus } from "./api.js";
import {
  apiBaseUrl,
  detectLaunchCommand,
  findAppId,
  findRuntimeToken,
  hasValidLocalTokenFormat,
  readProjectConfig,
  saveProjectConfig,
} from "./config.js";
import {
  printConnectionFailure,
  printInvalidToken,
  printMissingApp,
  printMissingCommand,
  printMissingToken,
  printRuntimeProcessError,
  printRunReady,
  printSecretFailure,
  printSetupSuccess,
} from "./output.js";
import { runPasswordManager } from "./password-manager.js";
import { secretValues } from "./redact.js";
import { childEnvironment, executableForPlatform } from "./runtime.js";

async function verifyRuntime(appId: string, token: string) {
  const baseUrl = apiBaseUrl();
  const result = await fetchRuntimeStatus(baseUrl, token, appId);
  if (result.kind !== "success") {
    printConnectionFailure(result);
    return undefined;
  }

  const secrets = await fetchRuntimeSecrets(baseUrl, token, appId);
  if (secrets.kind !== "success") {
    printSecretFailure(secrets);
    return undefined;
  }

  return { status: result.status, secrets: secrets.secrets };
}

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
  const launchCommand = command ? [command, ...args] : await detectLaunchCommand();
  if (!launchCommand) {
    printMissingCommand();
    return 1;
  }

  const runtime = await verifyRuntime(appId, token);
  if (!runtime) return 1;

  await saveProjectConfig({ appId, launchCommand });
  printSetupSuccess(runtime.status, launchCommand);
  return 0;
}

async function run() {
  const config = await readProjectConfig();
  if (!config?.appId) {
    printMissingApp();
    return 1;
  }
  if (!config.launchCommand) {
    printMissingCommand();
    return 1;
  }
  const token = await findRuntimeToken(process.cwd(), { includeProcessEnv: false });
  if (!token) {
    printMissingToken();
    return 1;
  }
  if (!hasValidLocalTokenFormat(token)) {
    printInvalidToken();
    return 1;
  }

  const runtime = await verifyRuntime(config.appId, token);
  if (!runtime) return 1;

  printRunReady(runtime.status, config.launchCommand);
  const [command, ...args] = config.launchCommand;
  let secrets: typeof runtime.secrets | undefined = runtime.secrets;
  const redactions = secretValues(secrets);
  const childEnv = childEnvironment(process.env, secrets);
  runtime.secrets = {};
  secrets = undefined;
  const child = spawn(executableForPlatform(command), args, {
    cwd: process.cwd(),
    env: childEnv,
    stdio: "inherit",
    shell: false,
  });

  return await new Promise<number>((resolve) => {
    child.once("spawn", () => {
      redactions.length = 0;
    });
    child.once("error", (error) => {
      printRuntimeProcessError(error, redactions);
      redactions.length = 0;
      resolve(1);
    });
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

if (process.argv[2] === "start") {
  const commandIndex = process.argv[3] === "--" ? 4 : 3;
  process.exitCode = await start(
    process.argv[commandIndex],
    process.argv.slice(commandIndex + 1),
  );
} else if (process.argv[2] === "run") {
  process.exitCode = await run();
} else {
  process.exitCode = await runPasswordManager(
    process.argv[2],
    process.argv.slice(3),
  );
}

#!/usr/bin/env node
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createRuntimeDeviceProof, createRuntimeSession, fetchRuntimeSecrets, fetchRuntimeStatus, registerRuntimeDevice } from "./api.js";
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
  printInvalidApiUrl,
  printMissingApp,
  printMissingCommand,
  printMissingToken,
  printRuntimeRevoked,
  printRuntimeWarning,
  printRuntimeProcessError,
  printRunReady,
  printRuntimeIntro,
  printRuntimeStep,
  printSecretFailure,
  printSetupSuccess,
} from "./output.js";
import { runPasswordManager } from "./password-manager.js";
import { secretValues } from "./redact.js";
import { childEnvironment, executableForPlatform } from "./runtime.js";
import { connectRuntimeSessionSocket } from "./runtime-session.js";
import { deviceLabel, getOrCreateRuntimeDeviceKey } from "./device.js";
import { printPasswordManagerHelp } from "./password-manager.js";

function warnIfDotenvIsTrackable() {
  if (!existsSync(".env")) return;
  try {
    execFileSync("git", ["check-ignore", "-q", "--", ".env"], { stdio: "ignore" });
  } catch {
    printRuntimeWarning(".env is not confirmed gitignored. Keep PASSWAY_TOKEN out of commits.");
  }
}

async function verifyRuntime(appId: string, token: string) {
  const baseUrl = apiBaseUrl();
  const result = await fetchRuntimeStatus(baseUrl, token, appId);
  if (result.kind !== "success") {
    printConnectionFailure(result);
    return undefined;
  }

  return { status: result.status };
}

async function start(command?: string, args: string[] = []) {
  printRuntimeIntro("START");
  let baseUrl: string;
  try { baseUrl = apiBaseUrl(); }
  catch { printInvalidApiUrl(); return 1; }
  const token = await findRuntimeToken();
  if (!token) {
    printMissingToken("start");
    return 1;
  }
  if (!hasValidLocalTokenFormat(token)) {
    printInvalidToken();
    return 1;
  }
  warnIfDotenvIsTrackable();
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

  printRuntimeStep("Checking hosted vault");
  const runtime = await verifyRuntime(appId, token);
  if (!runtime) return 1;
  printRuntimeStep("Registering this device");
  try {
    const device = await getOrCreateRuntimeDeviceKey(baseUrl, appId);
    await registerRuntimeDevice(baseUrl, token, device, deviceLabel());
  } catch {
    printConnectionFailure({ kind: "auth" });
    return 1;
  }

  await saveProjectConfig({ appId, apiUrl: baseUrl, launchCommand });
  printSetupSuccess(runtime.status, launchCommand);
  return 0;
}

async function run() {
  printRuntimeIntro("RUN");
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
    printMissingToken("run");
    return 1;
  }
  if (!hasValidLocalTokenFormat(token)) {
    printInvalidToken();
    return 1;
  }
  warnIfDotenvIsTrackable();

  let baseUrl: string;
  try { baseUrl = apiBaseUrl(); }
  catch { printInvalidApiUrl(); return 1; }
  printRuntimeStep("Checking hosted vault");
  const status = await fetchRuntimeStatus(baseUrl, token, config.appId);
  if (status.kind !== "success") {
    printConnectionFailure(status);
    return 1;
  }
  let proof: { challengeId: string; signature: string };
  printRuntimeStep("Authorizing this device");
  try {
    const device = await getOrCreateRuntimeDeviceKey(baseUrl, config.appId);
    proof = await createRuntimeDeviceProof(baseUrl, token, device);
  } catch {
    printConnectionFailure({ kind: "auth" });
    return 1;
  }
  const session = await createRuntimeSession(baseUrl, token, config.appId, proof);
  if (session.kind !== "success") {
    printSecretFailure(session);
    return 1;
  }

  printRuntimeStep("Loading secrets");
  const secrets = await fetchRuntimeSecrets(baseUrl, session.session);
  if (!secrets) {
    printSecretFailure({ kind: "server" });
    return 1;
  }

  const [command, ...args] = config.launchCommand;
  let child: ChildProcess | undefined;
  let revoked = false;
  const redactions = secretValues(secrets);
  const childEnv = childEnvironment(process.env, secrets);
  for (const key of Object.keys(secrets)) delete secrets[key];
  let socket: Awaited<ReturnType<typeof connectRuntimeSessionSocket>>;
  printRuntimeStep("Opening live session");
  try {
    socket = await connectRuntimeSessionSocket({
    apiBaseUrl: baseUrl,
    sessionId: session.session.sessionId,
    sessionToken: session.session.sessionToken,
    warn: printRuntimeWarning,
    onRevoke: () => {
      revoked = true;
      printRuntimeRevoked();
      child?.kill("SIGTERM");
      setTimeout(() => child?.kill("SIGKILL"), 5_000).unref();
    },
    });
  } catch {
    for (const key of session.session.secretKeys) delete childEnv[key];
    redactions.length = 0;
    printSecretFailure({ kind: "network" });
    return 1;
  }
  if (revoked) {
    socket.close();
    return 1;
  }

  printRunReady(status.status, config.launchCommand);
  child = spawn(executableForPlatform(command), args, {
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
    child.once("exit", (code) => {
      socket.close();
      resolve(revoked ? 1 : (code ?? 1));
    });
  });
}

if (["--help", "-h", "help"].includes(process.argv[2] ?? "")) {
  printPasswordManagerHelp();
  process.exitCode = 0;
} else if (process.argv[2] === "start") {
  const commandIndex = process.argv[3] === "--" ? 4 : 3;
  process.exitCode = await start(
    process.argv[commandIndex],
    process.argv.slice(commandIndex + 1),
  );
} else if (process.argv[2] === "run") {
  process.exitCode = await run();
} else if (!process.argv[2] && existsSync(".passway.json")) {
  const config = await readProjectConfig();
  if (!config) {
    printMissingApp();
    process.exitCode = 1;
  } else {
    process.exitCode = config.launchCommand ? await run() : await start();
  }
} else {
  process.exitCode = await runPasswordManager(
    process.argv[2],
    process.argv.slice(3),
  );
}

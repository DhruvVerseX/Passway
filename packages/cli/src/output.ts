import { box, intro, log, note, outro, spinner } from "@clack/prompts";
import type { RuntimeStatus, StatusResult } from "./api.js";
import { redactKnownSecrets } from "./redact.js";

type Failure = Exclude<StatusResult, { kind: "success" }>;
let activeStep: { animation: ReturnType<typeof spinner>; message: string } | undefined;

function finishRuntimeStep() {
  if (!activeStep) return;
  const { animation, message } = activeStep;
  activeStep = undefined;
  animation.stop(message);
}

export function printRuntimeIntro(command: "START" | "RUN") {
  finishRuntimeStep();
  intro(`✦ PASSWAY  /  ${command}`);
}

export function printRuntimeStep(message: string) {
  finishRuntimeStep();
  if (!process.stdout.isTTY) return log.step(message);
  const animation = spinner({ indicator: "dots", frames: ["·", "··", "···", "··"], delay: 120 });
  activeStep = { animation, message };
  animation.start(message);
}

function problem(message: string, guidance?: string) {
  if (activeStep) {
    activeStep.animation.error(message);
    activeStep = undefined;
  } else log.error(message);
  if (guidance) log.info(guidance);
}

export function printMissingToken(command: "start" | "run") {
  problem("No Passway token found", `Add PASSWAY_TOKEN to this project's .env, then run passway ${command}.`);
}

export function printInvalidToken() {
  problem("Unable to connect to Passway", "Your token is invalid, expired, or revoked. Create a new token in Passway.");
}

export function printInvalidApiUrl() {
  problem("Invalid Passway API URL", "Use HTTPS, or HTTP on localhost or 127.0.0.1.");
}

export function printMissingApp() {
  problem("No linked Passway vault found");
  note('{ "appId": "your-app-id" }', "Add .passway.json to this project");
}

export function printMissingCommand() {
  problem("No development command found");
  note("passway start -- npm run dev", "Set up your app command");
}

function failure(result: Failure, loadingSecrets: boolean) {
  switch (result.kind) {
    case "auth":
      problem(loadingSecrets ? "Vault authorization failed" : "Unable to connect to Passway", "Your token is invalid, expired, or revoked.");
      break;
    case "not_hosted":
      problem("Environment is not hosted", "Host this environment in the Passway dashboard first.");
      break;
    case "app_disabled":
      problem("Vault runtime is disabled", "Enable Host Vault in the Passway dashboard.");
      break;
    case "unhealthy":
      problem("Secret health verification failed", "Your secrets were not exposed. Check the environment in the Passway dashboard.");
      break;
    case "rate_limit":
      problem("Passway is rate limiting this request", "Try again shortly.");
      break;
    case "timeout":
      problem("The vault did not respond in time", "Check your connection and try again.");
      break;
    default:
      problem(loadingSecrets ? "Passway could not securely load the vault" : "Unable to reach Passway", "Check your connection and try again.");
  }
}

export function printConnectionFailure(result: Failure) {
  failure(result, false);
}

export function printSecretFailure(result: Failure) {
  failure(result, true);
}

function runtimeCard(status: RuntimeStatus) {
  const runtime = status.app.runtimeStatus === "hosted" ? "HOSTED" : "READY TO HOST";
  box(
    `Vault          ${status.app.name}\nEnvironment    ${status.environment.name}\nHealth         HEALTHY\nSecrets        ${status.secretCount} available\nRuntime        ${runtime}`,
    "RUNTIME CONNECTION",
    { width: 54 },
  );
}

export function printSetupSuccess(status: RuntimeStatus, launchCommand: string[]) {
  finishRuntimeStep();
  log.success(`${status.app.name} vault linked · ${status.secretCount} secrets available`);
  runtimeCard(status);
  note(`${launchCommand.join(" ")}\n\nNext: passway run`, "LAUNCH COMMAND");
  note(status.healthUrl, "Dashboard");
  outro("Setup complete");
}

export function printRunReady(status: RuntimeStatus, launchCommand: string[]) {
  finishRuntimeStep();
  log.success(`${status.secretCount} secrets loaded for ${status.app.name}`);
  runtimeCard(status);
  log.step(`Starting ${launchCommand.join(" ")}`);
}

export function printRuntimeProcessError(error: unknown, secrets: readonly string[]) {
  const message = error instanceof Error ? error.message : error;
  log.error(redactKnownSecrets(message, secrets), { output: process.stderr });
}

export function printRuntimeWarning(message: string) {
  log.warn(message, { output: process.stderr });
}

export function printRuntimeRevoked() {
  finishRuntimeStep();
  log.error("Runtime session revoked; stopping your app.", { output: process.stderr });
}

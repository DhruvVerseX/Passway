import type { RuntimeStatus, StatusResult } from "./api.js";

function line(value = "") {
  process.stdout.write(`${value}\n`);
}

export function printMissingToken() {
  line("Passway\n");
  line("✗ No Passway token found.\n");
  line("Add this to your project's .env:\n");
  line("PASSWAY_TOKEN=ps_live_xxxxx\n");
  line("Then run: passway start");
}

export function printInvalidToken() {
  line("Passway\n");
  line("✗ Unable to connect to Passway.\n");
  line("Your Passway token is invalid, expired, or revoked.");
}

export function printMissingApp() {
  line("Passway\n");
  line("✗ No linked Passway App found.\n");
  line("Add .passway.json to this project:\n");
  line('{ "appId": "your-app-id" }');
}

export function printConnectionFailure(result: Exclude<StatusResult, { kind: "success" }>) {
  line("Passway\n");
  if (result.kind === "auth") {
    line("✗ Unable to connect to Passway.\n");
    line("Your Passway token is invalid, expired, or revoked.");
  } else if (result.kind === "not_hosted") {
    line("✗ Environment is not hosted.\n");
    line("Open Passway and host this environment first.");
  } else if (result.kind === "app_disabled") {
    line("✗ App runtime is disabled.\n");
    line("Enable Host App in the Passway dashboard.");
  } else if (result.kind === "unhealthy") {
    line("✗ Secret health verification failed.\n");
    line("Your secrets were not exposed.");
    line("Check the environment in the Passway dashboard.");
  } else if (result.kind === "rate_limit") {
    line("✗ Passway is rate limiting this connection. Try again shortly.");
  } else {
    line("✗ Unable to reach Passway.\n");
    line("Check your connection and try again.");
  }
}

export function printSuccess(status: RuntimeStatus) {
  line("Passway\n");
  line("✓ Passway token found");
  line(`✓ Connected to ${status.environment.name}`);
  line(`✓ ${status.app.name} App linked`);
  line(`✓ ${status.secretCount} secrets available`);
  line("✓ Secret delivery verified\n");
  line(`● ${status.app.name} is ${status.app.runtimeStatus === "hosted" ? "healthy" : "ready to host"}\n`);
  line("Dashboard");
  line(status.healthUrl);
}

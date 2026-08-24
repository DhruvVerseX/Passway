import type { RuntimeStatus, StatusResult } from "./api.js";
import { bold, cyan, dim, frame, green } from "./terminal.js";

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
  line("✗ No linked Passway Vault found.\n");
  line("Add .passway.json to this project:\n");
  line('{ "appId": "your-app-id" }');
}

export function printConnectionFailure(
  result: Exclude<StatusResult, { kind: "success" }>,
) {
  line("Passway\n");
  if (result.kind === "auth") {
    line("✗ Unable to connect to Passway.\n");
    line("Your Passway token is invalid, expired, or revoked.");
  } else if (result.kind === "not_hosted") {
    line("✗ Environment is not hosted.\n");
    line("Open Passway and host this environment first.");
  } else if (result.kind === "app_disabled") {
    line("✗ Vault runtime is disabled.\n");
    line("Enable Host Vault in the Passway dashboard.");
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

export function printSecretFailure(
  result: Exclude<StatusResult, { kind: "success" }>,
) {
  line("Passway\n");
  if (result.kind === "auth") {
    line("✗ Vault authorization failed.");
    line("Your Passway token is invalid, expired, or revoked.");
  } else if (result.kind === "not_hosted") {
    line("✗ Environment is not hosted.");
    line("Host the environment in Passway before starting your app.");
  } else if (result.kind === "app_disabled") {
    line("✗ Vault runtime is disabled.");
    line("Enable Host Vault in the Passway dashboard.");
  } else if (result.kind === "unhealthy") {
    line("✗ Secret health verification failed.");
    line("Your secrets were not exposed.");
  } else if (result.kind === "rate_limit") {
    line("✗ Passway is rate limiting this vault request. Try again shortly.");
  } else if (result.kind === "timeout") {
    line("✗ The vault did not respond in time. Try again.");
  } else {
    line("✗ Passway could not securely load the vault.");
    line("Check your connection and try again.");
  }
}

export function printSuccess(status: RuntimeStatus) {
  const runtime =
    status.app.runtimeStatus === "hosted" ? "HOSTED" : "READY TO HOST";
  line(bold("Passway"));
  line(dim("Secure runtime connection\n"));
  line(`${green("✓")} Passway token found`);
  line(`${green("✓")} Connected to Passway Cloud`);
  line(`${green("✓")} ${status.app.name} Vault linked`);
  line(`${green("✓")} ${status.secretCount} secrets available`);
  line(`${green("✓")} Secret delivery verified\n`);
  line(
    frame(
      "Runtime connection",
      [
        `Vault        ${status.app.name}`,
        `Environment  ${status.environment.name}`,
        `State        ${green("HEALTHY")}`,
        `Secrets      ${status.secretCount}`,
        `Runtime      ${green(runtime)}`,
      ],
      72,
    ),
  );
  line(`\n${dim("Dashboard")}`);
  line(cyan(status.healthUrl));
}

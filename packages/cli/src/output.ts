import type { RuntimeStatus, StatusResult } from "./api.js";

function line(value = "") {
  process.stdout.write(`${value}\n`);
}

export function printMissingToken() {
  line("Passway\n");
  line("[x] No Passway token found.\n");
  line("Add your hosted environment token:\n");
  line("PASSWAY_TOKEN=ps_live_xxxxx\n");
  line("Then run:\n");
  line("passway start");
}

export function printInvalidToken(token: string) {
  line("Passway\n");
  line("[x] The Passway token format is invalid.\n");
  line(`Current token length: ${token.length}`);
  line("Required format: ps_live_<43 base64url characters>");
  line("Required token length: 51");
  if (!token.startsWith("ps_live_")) {
    line("The token must start with ps_live_.");
  } else if (token.length !== 51) {
    line("The token appears truncated. Copy the complete token from the hosting success dialog.");
  }
}

export function printConnectionFailure(result: Exclude<StatusResult, { kind: "success" }>) {
  line("Passway\n");
  if (result.kind === "auth") {
    line("[x] Unable to connect to Passway.\n");
    line("The runtime token is invalid, expired, or revoked.");
  } else if (result.kind === "rate_limit") {
    line("[x] Passway is rate limiting this connection. Try again shortly.");
  } else if (result.kind === "timeout") {
    line("[x] Passway did not respond in time. Try again.");
  } else {
    line("[x] Passway could not be reached.\n");
    line("Check your internet connection and try again.");
  }
}

export function printSuccess(status: RuntimeStatus) {
  line("Passway\n");
  line("[ok] Runtime token found");
  line("[ok] Runtime token authenticated");
  line(`[ok] ${status.environment.name}`);
  line(`[ok] ${status.secretCount} secrets available`);
  line("[ok] Encryption and delivery verified\n");
  line("[ok] Passway is ready\n");
  line(`Environment   ${status.environment.name}`);
  line(`Secrets       ${status.secretCount}`);
  line("Status        Hosted\n");
  line("Dashboard");
  line(status.dashboardUrl);
}

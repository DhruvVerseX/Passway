#!/usr/bin/env bun
import { fetchRuntimeStatus } from "./api.js";
import { apiBaseUrl, findAppId, findRuntimeToken, hasValidLocalTokenFormat } from "./config.js";
import { printConnectionFailure, printInvalidToken, printMissingApp, printMissingToken, printSuccess } from "./output.js";
import { runPasswordManager } from "./password-manager.js";

async function start() {
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

  const result = await fetchRuntimeStatus(apiBaseUrl(), token, appId);
  if (result.kind !== "success") {
    printConnectionFailure(result);
    return 1;
  }
  printSuccess(result.status);
  return 0;
}

if (process.argv[2] === "start") {
  process.exitCode = await start();
} else {
  process.exitCode = await runPasswordManager(process.argv[2], process.argv.slice(3));
}

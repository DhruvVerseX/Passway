#!/usr/bin/env bun
import { fetchRuntimeStatus } from "./api.js";
import { apiBaseUrl, findRuntimeToken, hasValidLocalTokenFormat } from "./config.js";
import { printConnectionFailure, printInvalidToken, printMissingToken, printSuccess } from "./output.js";

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

  const result = await fetchRuntimeStatus(apiBaseUrl(), token);
  if (result.kind !== "success") {
    printConnectionFailure(result);
    return 1;
  }
  printSuccess(result.status);
  return 0;
}

if (process.argv[2] !== "start") {
  process.stderr.write("Usage: passway start\n");
  process.exitCode = 1;
} else {
  process.exitCode = await start();
}

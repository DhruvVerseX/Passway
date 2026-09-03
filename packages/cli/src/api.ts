export interface RuntimeStatus {
  connected: true;
  environment: { id: string; name: string; status: "hosted" };
  app: {
    id: string;
    name: string;
    runtimeStatus: "draft" | "hosted";
    lastConnectedAt: string;
  };
  secretCount: number;
  delivery: "verified";
  health: "healthy";
  healthUrl: string;
}

export type StatusResult =
  | { kind: "success"; status: RuntimeStatus }
  | {
      kind:
        | "auth"
        | "not_hosted"
        | "app_disabled"
        | "unhealthy"
        | "rate_limit"
        | "server"
        | "network"
        | "timeout";
    };

export type RuntimeSecrets = Record<string, string>;

export interface RuntimeSession {
  sessionId: string;
  sessionToken: string;
  secrets: RuntimeSecrets;
}

export interface RuntimeDeviceChallenge { challengeId: string; challenge: string }

type SecretsResult =
  | { kind: "success"; secrets: RuntimeSecrets }
  | {
      kind:
        | "auth"
        | "not_hosted"
        | "app_disabled"
        | "unhealthy"
        | "rate_limit"
        | "server"
        | "network"
        | "timeout";
    };

type SessionResult =
  | { kind: "success"; session: RuntimeSession }
  | {
      kind:
        | "auth"
        | "not_hosted"
        | "app_disabled"
        | "unhealthy"
        | "rate_limit"
        | "server"
        | "network"
        | "timeout";
    };

function isRuntimeSecrets(value: unknown): value is RuntimeSecrets {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, secret]) =>
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && typeof secret === "string",
  );
}

function isRuntimeStatus(value: unknown): value is RuntimeStatus {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  const environment = response.environment as
    Record<string, unknown> | undefined;
  const app = response.app as Record<string, unknown> | undefined;
  return (
    response.connected === true &&
    typeof environment?.id === "string" &&
    typeof environment?.name === "string" &&
    environment.status === "hosted" &&
    typeof app?.id === "string" &&
    typeof app.name === "string" &&
    (app.runtimeStatus === "draft" || app.runtimeStatus === "hosted") &&
    typeof app.lastConnectedAt === "string" &&
    typeof response.secretCount === "number" &&
    response.delivery === "verified" &&
    response.health === "healthy" &&
    typeof response.healthUrl === "string"
  );
}

function isRuntimeSession(value: unknown): value is RuntimeSession {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return (
    typeof response.sessionId === "string" &&
    response.sessionId.startsWith("sess_") &&
    typeof response.sessionToken === "string" &&
    isRuntimeSecrets(response.secrets)
  );
}

function isRuntimeDeviceChallenge(value: unknown): value is RuntimeDeviceChallenge {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return typeof response.challengeId === "string" && response.challengeId.startsWith("dch_") && typeof response.challenge === "string";
}

export async function fetchRuntimeSecrets(
  apiBaseUrl: string,
  token: string,
  appId: string,
): Promise<SecretsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/runtime/secrets`, {
      headers: {
        authorization: `Bearer ${token}`,
        "x-passway-app-id": appId,
      },
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403)
      return { kind: "auth" };
    if (response.status === 409) return { kind: "not_hosted" };
    if (response.status === 423) return { kind: "app_disabled" };
    if (response.status === 422) return { kind: "unhealthy" };
    if (response.status === 429) return { kind: "rate_limit" };
    if (!response.ok) return { kind: "server" };
    const body: unknown = await response.json();
    return isRuntimeSecrets(body)
      ? { kind: "success", secrets: body }
      : { kind: "server" };
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? { kind: "timeout" }
      : { kind: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRuntimeStatus(
  apiBaseUrl: string,
  token: string,
  appId: string,
): Promise<StatusResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/runtime/status`, {
      headers: { authorization: `Bearer ${token}`, "x-passway-app-id": appId },
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403)
      return { kind: "auth" };
    if (response.status === 409) return { kind: "not_hosted" };
    if (response.status === 423) return { kind: "app_disabled" };
    if (response.status === 422) return { kind: "unhealthy" };
    if (response.status === 429) return { kind: "rate_limit" };
    if (!response.ok) return { kind: "server" };
    const body: unknown = await response.json();
    return isRuntimeStatus(body)
      ? { kind: "success", status: body }
      : { kind: "server" };
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? { kind: "timeout" }
      : { kind: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createRuntimeSession(
  apiBaseUrl: string,
  token: string,
  projectId: string,
  proof: { challengeId: string; signature: string },
): Promise<SessionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiBaseUrl}/api/runtime/sessions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ projectId, ...proof }),
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403)
      return { kind: "auth" };
    if (response.status === 409) return { kind: "not_hosted" };
    if (response.status === 423) return { kind: "app_disabled" };
    if (response.status === 422) return { kind: "unhealthy" };
    if (response.status === 429) return { kind: "rate_limit" };
    if (!response.ok) return { kind: "server" };
    const body: unknown = await response.json();
    return isRuntimeSession(body)
      ? { kind: "success", session: body }
      : { kind: "server" };
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? { kind: "timeout" }
      : { kind: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

async function deviceRequest(
  apiBaseUrl: string,
  token: string,
  path: string,
  body: Record<string, string>,
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Device authentication failed");
  const result: unknown = await response.json();
  if (!isRuntimeDeviceChallenge(result)) throw new Error("Device authentication failed");
  return result;
}

export async function registerRuntimeDevice(
  apiBaseUrl: string,
  token: string,
  device: { publicKey: string; sign(challengeId: string, challenge: string): string },
  label: string,
) {
  const challenge = await deviceRequest(apiBaseUrl, token, "/api/runtime/devices/registration-challenges", { publicKey: device.publicKey, label });
  const response = await fetch(`${apiBaseUrl}/api/runtime/devices/register`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ challengeId: challenge.challengeId, signature: device.sign(challenge.challengeId, challenge.challenge) }),
  });
  if (!response.ok) throw new Error("Device registration failed");
}

export async function createRuntimeDeviceProof(
  apiBaseUrl: string,
  token: string,
  device: { publicKey: string; sign(challengeId: string, challenge: string): string },
) {
  const challenge = await deviceRequest(apiBaseUrl, token, "/api/runtime/devices/challenges", { publicKey: device.publicKey });
  return { challengeId: challenge.challengeId, signature: device.sign(challenge.challengeId, challenge.challenge) };
}

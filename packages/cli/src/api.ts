export interface RuntimeStatus {
  connected: true;
  environment: { id: string; name: string; status: "hosted" };
  app: { id: string; name: string; runtimeStatus: "draft" | "hosted"; lastConnectedAt: string };
  secretCount: number;
  delivery: "verified";
  health: "healthy";
  healthUrl: string;
}

export type StatusResult =
  | { kind: "success"; status: RuntimeStatus }
  | { kind: "auth" | "not_hosted" | "app_disabled" | "unhealthy" | "rate_limit" | "server" | "network" | "timeout" };

function isRuntimeStatus(value: unknown): value is RuntimeStatus {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  const environment = response.environment as Record<string, unknown> | undefined;
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

export async function fetchRuntimeStatus(apiBaseUrl: string, token: string, appId: string): Promise<StatusResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/runtime/status`, {
      headers: { authorization: `Bearer ${token}`, "x-passway-app-id": appId },
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) return { kind: "auth" };
    if (response.status === 409) return { kind: "not_hosted" };
    if (response.status === 423) return { kind: "app_disabled" };
    if (response.status === 422) return { kind: "unhealthy" };
    if (response.status === 429) return { kind: "rate_limit" };
    if (!response.ok) return { kind: "server" };
    const body: unknown = await response.json();
    return isRuntimeStatus(body) ? { kind: "success", status: body } : { kind: "server" };
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? { kind: "timeout" }
      : { kind: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

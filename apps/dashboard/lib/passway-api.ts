import { apiBaseURL, signInURL } from "./auth-ui";

export type ApiProject = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
};

export type ApiEnvironment = {
  id: string;
  projectId: string;
  secretCount: number;
  tokenCount: number;
  activeRuntimeSessions: number;
  revocationLevel: string;
  name: string;
  type: "development" | "preview" | "staging" | "production" | "custom";
  description: string | null;
  status: "draft" | "locked" | "hosted" | "disabled";
  lockedAt: string | null;
  hostedAt: string | null;
  runtimeEnabled: boolean;
  runtimeHostedAt: string | null;
  runtimeDisabledAt: string | null;
  lastConnectedAt: string | null;
  lastHealthCheckAt: string | null;
  lastHealthHealthy: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiSecret = {
  id: string;
  environmentId: string;
  key: string;
  description: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiRuntimeToken = {
  environmentId: string;
  status: "hosted";
  token: string;
  createdAt: string;
};

export type ApiAppRuntime = {
  id: string;
  name: string;
  runtimeStatus: "hosted" | "disabled";
  hostedAt?: string;
  disabledAt?: string;
  secretCount?: number;
};

export type CreateEnvironmentInput = {
  name: string;
  type: ApiEnvironment["type"];
  description?: string;
};

export class PasswayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "PasswayApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseURL()}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String(body.error)
        : "Passway API request failed";
    if (
      response.status === 401 &&
      message.toLowerCase().includes("re-authentication") &&
      typeof window !== "undefined"
    ) {
      window.location.assign(signInURL(window.location.href));
    }
    throw new PasswayApiError(message, response.status, body);
  }

  return body as T;
}

export function createEnvironment(
  projectId: string,
  input: CreateEnvironmentInput,
) {
  return request<{ environment: ApiEnvironment }>(
    `/v1/projects/${encodeURIComponent(projectId)}/environments`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function listEnvironments(projectId: string) {
  return request<{ environments: ApiEnvironment[] }>(
    `/v1/projects/${encodeURIComponent(projectId)}/environments`,
  );
}

export function deleteEnvironment(environmentId: string) {
  return request<void>(
    `/v1/environments/${encodeURIComponent(environmentId)}`,
    { method: "DELETE" },
  );
}

export function createSecret(
  environmentId: string,
  input: { key: string; value: string },
) {
  return request<{ secret: ApiSecret }>(
    `/v1/environments/${encodeURIComponent(environmentId)}/secrets`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function importEnv(environmentId: string, content: string) {
  return request<{ imported: number; secrets: Array<{ key: string }> }>(
    `/v1/environments/${encodeURIComponent(environmentId)}/import`,
    {
      method: "POST",
      body: content,
      headers: { "Content-Type": "text/plain" },
    },
  );
}

export function listSecrets(environmentId: string) {
  return request<{ secrets: ApiSecret[] }>(
    `/v1/environments/${encodeURIComponent(environmentId)}/secrets`,
  );
}

export function deleteSecret(environmentId: string, key: string) {
  return request<void>(
    `/v1/environments/${encodeURIComponent(environmentId)}/secrets/${encodeURIComponent(key)}`,
    { method: "DELETE" },
  );
}

export function lockEnvironment(environmentId: string) {
  return request<{ environment: ApiEnvironment }>(
    `/v1/environments/${encodeURIComponent(environmentId)}/lock`,
    { method: "POST" },
  );
}

export function hostEnvironment(environmentId: string) {
  return request<ApiRuntimeToken>(
    `/v1/environments/${encodeURIComponent(environmentId)}/host`,
    { method: "POST" },
  );
}

export function hostAppRuntime(appId: string) {
  return request<ApiAppRuntime>(`/v1/apps/${encodeURIComponent(appId)}/host`, { method: "POST" });
}

export function disableAppRuntime(appId: string) {
  return request<ApiAppRuntime>(`/v1/apps/${encodeURIComponent(appId)}/disable-runtime`, { method: "POST" });
}

export function rotateRuntimeToken(environmentId: string) {
  return request<ApiRuntimeToken>(
    `/v1/environments/${encodeURIComponent(environmentId)}/runtime-tokens/rotate`,
    { method: "POST" },
  );
}

export function getConfiguredProjectId() {
  const configured = process.env.NEXT_PUBLIC_PASSWAY_PROJECT_ID?.trim() ?? "";
  return configured && configured !== "your-project-id" ? configured : "";
}

export function listProjects() {
  return request<{ projects: ApiProject[] }>("/v1/projects");
}

export async function resolveProjectId() {
  const configured = getConfiguredProjectId();
  if (configured) return configured;

  const result = await listProjects();
  return result.projects[0]?.id ?? "";
}

export function bootstrapProject() {
  return request<{
    project: ApiProject;
    created: boolean;
  }>("/v1/bootstrap", { method: "POST", body: JSON.stringify({}) });
}

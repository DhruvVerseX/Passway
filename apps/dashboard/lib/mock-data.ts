export const projects = [
  {
    id: "amiworthy",
    name: "AmiWorthy",
    environment: "development",
    secrets: 12,
    tokens: 2,
  },
  {
    id: "viruj-health",
    name: "Viruj Health",
    environment: "production",
    secrets: 18,
    tokens: 1,
  },
  {
    id: "envvault-demo",
    name: "EnvVault Demo",
    environment: "development",
    secrets: 6,
    tokens: 1,
  },
];

export const secrets: Array<{ key: string; updated: string }> = [];

export const tokens: Array<{
  id: string;
  value: string;
  label: string;
  created: string;
  lastUsed: string;
}> = [];

export const logs = [
  {
    id: "log_01",
    code: 200,
    status: "Success",
    event: "Secrets fetched",
    ip: "103.21.58.14",
    time: "2 min ago",
  },
  {
    id: "log_02",
    code: 401,
    status: "Invalid token",
    event: "Request rejected",
    ip: "45.79.11.208",
    time: "18 min ago",
  },
  {
    id: "log_03",
    code: 403,
    status: "IP blocked",
    event: "Request rejected",
    ip: "198.51.100.24",
    time: "1 hour ago",
  },
  {
    id: "log_04",
    code: 429,
    status: "Rate limited",
    event: "Request throttled",
    ip: "103.21.58.14",
    time: "3 hours ago",
  },
];

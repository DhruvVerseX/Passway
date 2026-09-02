import WebSocket from "ws";

const HEARTBEAT_MS = 15_000;
const FAIL_OPEN_AFTER_MS = 45_000;
const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 15_000];

function socketUrl(apiBaseUrl: string, sessionId: string) {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/runtime/${sessionId}`;
  url.search = "";
  return url.toString();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectRuntimeSessionSocket(input: {
  apiBaseUrl: string;
  sessionId: string;
  sessionToken: string;
  onRevoke: () => void;
  warn: (message: string) => void;
}) {
  let closed = false;
  let socket: WebSocket | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let warned = false;
  let retry = 0;

  const connect = () =>
    new Promise<void>((resolve, reject) => {
      let opened = false;
      const next = new WebSocket(socketUrl(input.apiBaseUrl, input.sessionId), {
        headers: { Authorization: `Bearer ${input.sessionToken}` },
      });
      socket = next;

      next.once("open", () => {
        opened = true;
        retry = 0;
        heartbeat = setInterval(() => {
          try {
            socket?.send(JSON.stringify({ type: "heartbeat" }));
          } catch {
            // The close handler owns reconnect; one missed send should not kill the child.
          }
        }, HEARTBEAT_MS);
        resolve();
      });
      next.on("message", (data) => {
        try {
          const text = typeof data === "string" ? data : data.toString();
          const message = JSON.parse(text) as { type?: unknown };
          if (message.type === "revoke") input.onRevoke();
        } catch {
          // Ignore malformed server messages; only an explicit revoke stops the child.
        }
      });
      next.once("error", () => {
        if (!opened) reject(new Error("runtime websocket failed"));
      });
      next.once("close", () => {
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = undefined;
        if (!closed && opened) void reconnect();
      });
    });

  const reconnect = async () => {
    const startedAt = Date.now();
    while (!closed) {
      if (!warned && Date.now() - startedAt >= FAIL_OPEN_AFTER_MS) {
        warned = true;
        input.warn("Passway live revocation channel is unreachable; app is continuing fail-open.");
      }
      await wait(BACKOFF_MS[Math.min(retry++, BACKOFF_MS.length - 1)]);
      try {
        await connect();
        return;
      } catch {
        // Keep trying; extended outage is explicitly fail-open.
      }
    }
  };

  try {
    await connect();
  } catch {
    void reconnect();
  }

  return {
    close() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      socket?.close();
    },
  };
}

import type { IncomingMessage, Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  authenticateRuntimeSession,
  expireHeartbeatTimeouts,
  renewRuntimeSession,
} from "./services/runtime-session.service.js";

const sockets = new Map<string, Set<WebSocket>>();

function bearer(req: IncomingMessage) {
  const [scheme, token, extra] = String(req.headers.authorization ?? "").split(" ");
  return scheme === "Bearer" && token && !extra ? token : undefined;
}

function sessionId(req: IncomingMessage) {
  const url = new URL(req.url ?? "", "http://localhost");
  const [, kind, id, extra] = url.pathname.split("/");
  return kind === "runtime" && id?.startsWith("sess_") && !extra ? id : undefined;
}

export function pushRuntimeSessionRevoke(id: string) {
  const message = JSON.stringify({ type: "revoke" });
  for (const socket of sockets.get(id) ?? []) {
    socket.send(message);
    socket.close(4001, "revoked");
  }
}

export function attachRuntimeSessionWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    const id = sessionId(req);
    if (!id) return;

    const token = bearer(req) ?? "";
    let session;
    try {
      session = await authenticateRuntimeSession(id, token);
    } catch {
      socket.destroy();
      return;
    }
    if (!session) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const set = sockets.get(id) ?? new Set<WebSocket>();
      set.add(ws);
      sockets.set(id, set);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString()) as { type?: unknown };
          if (message.type === "heartbeat") {
            void renewRuntimeSession(id, token).then((renewed) => {
              if (!renewed) ws.close(4001, "inactive");
            }).catch(() => ws.close(1011, "renewal failed"));
          }
        } catch {
          ws.close(1003, "invalid message");
        }
      });
      ws.on("close", () => {
        set.delete(ws);
        if (set.size === 0) sockets.delete(id);
      });
    });
  });

  setInterval(() => {
    void expireHeartbeatTimeouts(pushRuntimeSessionRevoke).catch(() => undefined);
  }, 15_000).unref();
}

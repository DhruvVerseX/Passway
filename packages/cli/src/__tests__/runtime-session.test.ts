import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocketServer } from "ws";
import { connectRuntimeSessionSocket } from "../runtime-session.js";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("runtime connection startup", () => {
  it("rejects an unavailable revocation channel before the app can start", async () => {
    const server = createServer((_req, res) => res.writeHead(404).end());
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");

    await expect(connectRuntimeSessionSocket({
      apiBaseUrl: `http://127.0.0.1:${address.port}`,
      sessionId: "sess_a",
      sessionToken: "ps_live_token",
      onRevoke: () => undefined,
      warn: () => undefined,
    })).rejects.toThrow();
  });

  it("treats an inactive session close as revocation", async () => {
    const server = createServer();
    servers.push(server);
    const wss = new WebSocketServer({ server });
    wss.on("connection", (socket) => setTimeout(() => socket.close(4001, "inactive"), 10));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");

    let onRevoke!: () => void;
    const revoked = new Promise<void>((resolve) => { onRevoke = resolve; });
    const connection = await connectRuntimeSessionSocket({
      apiBaseUrl: `http://127.0.0.1:${address.port}`,
      sessionId: "sess_a",
      sessionToken: "ps_live_token",
      onRevoke,
      warn: () => undefined,
    });
    await revoked;
    connection.close();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });
});

import { createServer } from "node:http";
import WebSocket from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRuntimeSession: vi.fn(),
  expireHeartbeatTimeouts: vi.fn(),
  renewRuntimeSession: vi.fn(),
}));

vi.mock("../services/runtime-session.service.js", () => mocks);

afterEach(() => vi.clearAllMocks());

describe("runtime session websocket", () => {
  it("renews a valid session on heartbeat", async () => {
    mocks.authenticateRuntimeSession.mockResolvedValue({ sessionId: "sess_a" });
    mocks.renewRuntimeSession.mockResolvedValue(true);
    const { attachRuntimeSessionWebSocket } = await import("../runtime-websocket.js");
    const server = createServer();
    attachRuntimeSessionWebSocket(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/runtime/sess_a`, {
      headers: { Authorization: `Bearer ps_live_${"a".repeat(43)}` },
    });

    try {
      await new Promise<void>((resolve, reject) => {
        socket.once("open", resolve);
        socket.once("error", reject);
      });
      socket.send(JSON.stringify({ type: "heartbeat" }));
      await vi.waitFor(() => {
        expect(mocks.renewRuntimeSession).toHaveBeenCalledWith(
          "sess_a",
          `ps_live_${"a".repeat(43)}`,
        );
      });
    } finally {
      socket.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

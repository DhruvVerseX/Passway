import { afterEach, expect, it, vi } from "vitest";

const shared = vi.hoisted(() => ({ counts: new Map<string, number>(), updates: vi.fn() }));

vi.mock("../../db/index.js", () => ({
  db: {
    insert: () => ({
      values: ({ id }: { id: string }) => ({
        onConflictDoUpdate: (update: unknown) => {
          shared.updates(update);
          return {
            returning: async () => {
              const count = (shared.counts.get(id) ?? 0) + 1;
              shared.counts.set(id, count);
              return [{ count }];
            },
          };
        },
      }),
    }),
  },
}));

afterEach(() => { shared.counts.clear(); shared.updates.mockClear(); vi.resetModules(); });

it("shares the runtime request limit across separate API module instances", async () => {
  const first = (await import("../runtime-auth.js")).requireRuntimeToken;
  vi.resetModules();
  const second = (await import("../runtime-auth.js")).requireRuntimeToken;
  const token = `ps_live_${"a".repeat(43)}`;

  async function request(handler: typeof first) {
    let status = 200;
    let passed = false;
    const req = { ip: "127.0.0.1", header: () => `Bearer ${token}` };
    const res = {
      set: () => res,
      status(code: number) { status = code; return res; },
      json: () => res,
    };
    await handler(req as never, res as never, () => { passed = true; });
    return { status, passed };
  }

  for (let i = 0; i < 120; i++) {
    expect(await request(i % 2 ? first : second)).toEqual({ status: 200, passed: true });
  }
  expect(await request(second)).toEqual({ status: 429, passed: false });
  expect(shared.updates).toHaveBeenCalled();
  expect(shared.counts.size).toBe(2);
});

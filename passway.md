# Passway Runtime Secret Exposure & Revocation — Solution Plan

## Context

Passway's current `passway run` flow injects real secrets (DB URLs, API keys, etc.)
into a child process's `process.env`. This is the **Static Environment Mode**
described in the original problem doc. Its guarantee is honest but limited:

> Disabling runtime prevents *future* retrieval through Passway.
> It does **not** guarantee that already-delivered secrets stop working.

Once a secret is injected, it can be copied, logged, or reused independently of
Passway, and revoking `PASSWAY_TOKEN` does not revoke the underlying credential
(Postgres password, Stripe key, etc.) at the source.

This doc lays out what to actually build, in priority order, and — just as
importantly — what to explicitly **not** build and why.

---

## Design goal (clarified)

The concrete goal being solved here is:

- Secrets must **never touch local disk** (already true today — env vars are
  RAM-only, no `.env` file written by Passway).
- Shrink the exposure window when runtime access is disabled, via a **live
  revocation channel**, instead of relying on the developer to re-run a
  command.

Two ideas that were considered and explicitly rejected:

- **RAM scanning / direct access to the app's process memory** — requires
  OS-level debugger privileges (ptrace, etc.), can't reliably catch every copy
  of a secret (V8 heap copies, GC garbage, log buffers), and by the time you'd
  redact it the secret has already been used. Also adds a dangerous new
  permission surface. **Rejected.**
- **"Encrypt the secret in local RAM, only the vault can decrypt it"** — if the
  decryption key is also on the local machine, an attacker with RAM access
  reads both and decrypts; if the key stays server-side, the app has to call
  out to the server on every use, which is just **proxy mode** by another
  name. There is no way to get real protection while keeping both ciphertext
  and key on the same untrusted machine. **Rejected as stated; if this
  property is truly wanted, build proxy mode instead (out of scope for now).**

---

## Phase 1 — Immediate hardening of Static Environment Mode

Small, fast, closes accidental (not deliberate) exposure paths. Do this
regardless of anything else below.

- Spawn child processes directly, never via a shell string:
  ```ts
  spawn(command, args, {
    shell: false,
    stdio: "inherit",
    env: { ...process.env, ...secrets }
  });
  ```
  Never build a command like `exec(\`DATABASE_URL=${secret} npm run dev\`)` —
  this can leak into shell history, process args, and debug logs.
- Never log the full env object, the full vault HTTP response, or full config
  objects (`console.log(process.env)`, `console.log(config)`, etc.).
- Redact known secret values from any log/error output before printing.
- Disable request/response body logging specifically for the vault-fetch
  endpoint.
- Clear/null out intermediate variables holding raw secrets once the child
  process env has been built.
- Document the one gap that can't be closed at the app layer: OS-level
  swap/pagefile could in theory page RAM to disk under memory pressure. This
  is outside app-level control — disclose it, don't overclaim.

**Explicitly not covered by Phase 1:** deliberate extraction (a developer
reading `process.env` on purpose), third-party dependency logging (e.g. a
malicious npm package or an SDK like Sentry logging env vars on its own).
Phase 1 only removes *accidental* leak paths.

---

## Phase 2 — Live revocation via persistent session

Upgrades revocation from "next time the command is re-run" to "near-instant,"
without requiring proxy mode or leased credentials. This is the main new
piece to build.

### Session creation (on `passway run`)

```
POST /api/runtime/sessions
Authorization: Bearer <PASSWAY_TOKEN>
Body: { projectId }

Response: {
  sessionId: "sess_abc123",
  sessionToken: "<short-lived JWT scoped only to this session>",
  secrets: { DATABASE_URL: "...", STRIPE_SECRET_KEY: "..." }
}
```

Use a separate, short-lived `sessionToken` for the socket connection instead
of the long-lived `PASSWAY_TOKEN`, so the live channel can be invalidated
independently and blast radius stays small.

### Persistent WebSocket connection

Opened right after secrets are fetched, before the child process spawns:

```ts
const ws = new WebSocket(`wss://vault.passway.dev/runtime/${sessionId}`, {
  headers: { Authorization: `Bearer ${sessionToken}` }
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === "revoke") {
    child.kill("SIGTERM"); // escalate to SIGKILL if it doesn't exit cleanly
    process.exit(1);
  }
});

ws.on("close", () => {
  // see reconnection handling below
});
```

WebSocket (push-based) is preferred over polling/SSE — polling caps your
"instant" at the poll interval and burns resources for no benefit.

### Heartbeat (both directions)

```ts
// CLI -> Vault, every 15s
setInterval(() => ws.send(JSON.stringify({ type: "heartbeat" })), 15_000);

// Vault -> CLI: if no heartbeat received in 45s, treat session as dead
// and garbage-collect server-side session state
```

This also lets the dashboard accurately show active session counts and lets
the vault clean up sessions from crashed CLIs / killed terminals.

### Disconnect / reconnect handling

Two distinct failure modes — handle them differently:

- **Transient network blip:** retry connecting with backoff before treating it
  as a lost session. Don't kill the app on the first dropped socket.
- **Vault unreachable for an extended period:** pick and document a
  fail-open vs fail-closed policy explicitly.
  - Fail-closed = more "secure" on paper, but a Passway outage kills every
    running app.
  - Fail-open = app keeps running through an outage, log a loud warning.
  - Recommendation: fail-open with a clearly logged warning, and call this
    out as a documented design decision rather than a silent default.

### Revoke trigger (dashboard side)

```
POST /api/runtime/sessions/:sessionId/revoke
```

Server-side: mark the session invalid, push `{ type: "revoke" }` to every open
socket for that session, and also reject the session token on any subsequent
HTTP request as a backstop in case the socket push doesn't land.

### Audit logging

Keep it simple — no need to over-engineer:
```
{ sessionId, event: "created" | "revoked" | "heartbeat_timeout", timestamp }
```
Never log secret values themselves.

**Estimated scope:** ~1–2 days (session endpoint, WebSocket server, CLI-side
listener, dashboard revoke button wired to it).

---

## What live revocation does and does NOT solve — be explicit about this

Timeline to keep in mind:

```
t=0    passway run -> secret injected into process.env
t=1    developer reads/copies the DATABASE_URL out of process.env
t=5    "disable runtime" clicked
t=5.2  CLI receives revoke push, kills the child process
```

- **Does solve:** the "forgot to turn it off" case. Shrinks exposure window
  from "however long until someone reruns the command" to a few seconds.
  Probably the most common real-world risk.
- **Does NOT solve:** deliberate extraction. If the secret was already copied
  at `t=1`, killing the process at `t=5.2` does nothing about that copy — the
  underlying credential is still valid at the source (Postgres, Stripe, etc.)
  until it's rotated there. Live revocation is still fundamentally "Static
  Environment Mode," just with a much faster reaction time — it does not
  change the **revocation level** from the original problem doc's table.

State this distinction explicitly in any report/writeup: live revocation is a
strict improvement to Static mode's *reaction time*, not an upgrade to Leased
or Proxy mode's *guarantee*.

---

## Explicitly out of scope for this phase (future work, not to be built now)

- **Leased/short-lived credentials** (e.g. temporary Postgres roles via
  `CREATE ROLE ... VALID UNTIL`) — realistic to build later, especially for
  Postgres since you control the DB directly. Good next milestone.
- **Proxy mode** (app never receives the raw secret; Passway gateway holds it
  and forwards authenticated requests) — realistic for HTTP APIs (Stripe,
  etc.) via a reverse-proxy-style SDK call; a full Postgres wire-protocol
  proxy is a much bigger systems project and should not be assumed in-scope
  without a real time/complexity assessment first.
- **Dynamic per-session credential generation, automatic downstream
  rotation, RAM scanning** — roadmap items, not this-project items. Mention
  as future work in the report; don't attempt to build them now.

---

## Summary framing for the project report

- Phase 1 = eliminate *accidental* disk/log exposure in Static mode.
- Phase 2 = live revocation = shrinks the exposure window for Static mode via
  a persistent session + heartbeat + push-revoke channel.
- Explicitly documented: this does **not** achieve true immediate revocation
  of an already-copied credential — that requires Leased or Proxy mode, which
  are named as the next architectural milestones, not delivered in this
  phase.
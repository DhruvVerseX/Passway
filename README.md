# passway-api

The backend for Passway: token issuance, envelope encryption, and the
runtime secret-fetch endpoint. This is the piece the dashboard talks to.

## Run it

```
npm install
cp .env.example .env      # then edit PASSWAY_ADMIN_KEY, generate a master key:
openssl rand -base64 32   # paste the output into PASSWAY_MASTER_KEY
npm run dev
```

Server starts on `http://localhost:4000`.

## The flow, end to end

```
# 1. Issue a token (dashboard -> API, admin-authenticated)
curl -X POST localhost:4000/v1/admin/tokens \
  -H "x-admin-key: $PASSWAY_ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"project":"checkout-service","environment":"production","label":"ci-runner","expiresInDays":30}'
# -> { "token": "psw_live_...", "expiresAt": "..." }
# The raw token is shown exactly once. Only its hash is stored after this.

# 2. Store a secret (dashboard -> API, admin-authenticated)
curl -X POST localhost:4000/v1/admin/secrets \
  -H "x-admin-key: $PASSWAY_ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"project":"checkout-service","environment":"production","key":"STRIPE_KEY","value":"sk_live_..."}'

# 3. App fetches it (the actual runtime call, token-authenticated)
curl localhost:4000/v1/secrets/STRIPE_KEY -H "Authorization: Bearer psw_live_..."
# -> { "key": "STRIPE_KEY", "value": "sk_live_..." }
# This request is what shows up in the audit log — allowed or denied.

# 4. Check who fetched what
curl localhost:4000/v1/admin/audit -H "x-admin-key: $PASSWAY_ADMIN_KEY"

# 5. Revoke a token
curl -X DELETE localhost:4000/v1/admin/tokens/<id> -H "x-admin-key: $PASSWAY_ADMIN_KEY"
```

## Routes

| Method | Path                          | Auth        | What it does |
|---|---|---|---|
| POST   | `/v1/admin/tokens`            | admin key   | Issue a scoped token |
| GET    | `/v1/admin/tokens`            | admin key   | List tokens (no hashes returned) |
| DELETE | `/v1/admin/tokens/:id`        | admin key   | Revoke a token |
| POST   | `/v1/admin/secrets`           | admin key   | Create/update a secret (encrypts before storing) |
| GET    | `/v1/admin/secrets`           | admin key   | List secret keys + metadata for a project/env (no values) |
| POST   | `/v1/admin/secrets/:key/reveal` | admin key | Decrypt and return one secret's value |
| DELETE | `/v1/admin/secrets/:key`      | admin key   | Delete a secret |
| GET    | `/v1/admin/audit`             | admin key   | Read the audit log |
| GET    | `/v1/secrets/:key`            | bearer token | **The runtime endpoint.** What a consuming app calls at startup. |

## What's real vs. what's a placeholder

**Real, and matches the architecture we designed:**
- Envelope encryption (`src/crypto/envelope.ts`) — per-secret AES-256-GCM
  data key, wrapped by a master key. Standard library crypto only, no
  homemade algorithm.
- Tokens are 256-bit random, only their SHA-256 hash is ever stored
  (`src/crypto/tokens.ts`).
- The runtime endpoint (`GET /v1/secrets/:key`) is the actual trust
  boundary — server-side decrypt, TLS in front of it in production,
  every call logged whether it succeeds or fails.
- Revocation takes effect immediately on the next request — no redeploy,
  since the check happens per-request against the stored token record.

**Placeholders you should replace before this handles real users:**
- **`LocalKms` (`src/crypto/kms.ts`)** simulates a KMS with an env-var
  master key. Swap for AWS KMS, GCP KMS, or Vault's transit engine —
  the `Kms` interface is designed so only this one file changes.
- **`src/store/db.ts`** is a JSON file on disk. Fine for building against
  locally; replace with Postgres (Prisma is a reasonable choice) before
  you have concurrent writes or care about backups.
- **Admin auth (`src/middleware/adminAuth.ts`)** is one shared static
  key. Replace with real session auth (e.g. the dashboard authenticates
  users via NextAuth, then calls this API with a short-lived JWT this
  service verifies) before more than one person uses the dashboard.
- **No rate limiting, no HTTPS termination here** — put this behind a
  reverse proxy (Caddy, nginx, or your host's load balancer) that
  terminates TLS; don't run this bare on the public internet.

## Wiring up the dashboard

The Passway dashboard (Next.js) should call the `/v1/admin/*` routes
from its own server-side API routes or server actions — never directly
from the browser, since that would expose `PASSWAY_ADMIN_KEY` to the
client. Keep the admin key server-side only.
# Passway

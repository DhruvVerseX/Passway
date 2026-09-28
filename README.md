# Passway

Passway is a developer tool for managing application secrets and controlled access across projects and environments.

## Structure

- `apps/api` - Express API (`api.passway.co.in`)
- `apps/web` - marketing site and docs (`passway.co.in`, `/docs`)
- `apps/dashboard` - dashboard (`app.passway.co.in`)

## Local Development

```bash
bun install
cp .env.example .env
bun dev
```

Local surfaces:

```bash
bun run dev:api        # http://localhost:4000
bun run dev:web        # http://localhost:3000
bun run dev:dashboard  # http://localhost:3001
```

Build frontends with `bun run build:frontends`.

## Env File Ownership

- `apps/api/.env` - backend-only secrets: database, Better Auth, OAuth secrets, Resend, admin key, KMS key.
- `apps/dashboard/.env` - dashboard public runtime settings only, such as `NEXT_PUBLIC_PASSWAY_API_URL`.
- `apps/web/.env` - marketing/docs public runtime settings only.
- root `.env` - optional convenience values when running the whole workspace locally.

Backend logic, auth configuration, database schema, migrations, and email delivery belong in `apps/api`. Dashboard and web should call the API instead of owning backend state.

## Dashboard Authentication Setup

Passway dashboard auth uses Better Auth 1.6, Neon PostgreSQL, Google OAuth, GitHub OAuth, email/password sign-in, email verification, password reset, and Resend transactional email.

1. Create a Neon PostgreSQL database and copy its pooled connection string into `DATABASE_URL`.
2. Generate a Better Auth secret with `openssl rand -base64 32` and set `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL` in `apps/api/.env` to `http://localhost:4000` locally and `https://api.passway.co.in` in production.
4. Create Google OAuth credentials and add these redirect URIs:
   - Local: `http://localhost:4000/api/auth/callback/google`
   - Production: `https://api.passway.co.in/api/auth/callback/google`
5. Create GitHub OAuth credentials and add these callback URLs:
   - Local: `http://localhost:4000/api/auth/callback/github`
   - Production: `https://api.passway.co.in/api/auth/callback/github`
6. Create a Resend API key, verify the `passway.co.in` sender domain, and set `RESEND_FROM_EMAIL` to `Passway <auth@passway.co.in>` or another verified sender.
7. Apply auth tables to Neon:

```bash
bun run --cwd apps/api db:migrate
```

For manual SQL review, the initial auth migration is `apps/api/drizzle/0000_better_auth.sql`.

### Production Environment Variables

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="https://api.passway.co.in"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
RESEND_API_KEY=""
RESEND_FROM_EMAIL="Passway <auth@passway.co.in>"
```

On hosting, configure API secrets only on the API service. Dashboard/web should only use public API URL values such as `NEXT_PUBLIC_PASSWAY_API_URL`. Do not prefix secrets with `NEXT_PUBLIC_`.

### Manual Auth Checklist

- Run `bun run --cwd apps/api db:migrate` against the Neon development database.
- Start `bun run dev:dashboard`.
- Register with name, email, and password.
- Confirm Resend sends a verification email.
- Verify the email and sign in.
- Visit `/dashboard` and `/projects` after sign-in.
- Sign out from the user menu.
- Confirm `/dashboard` redirects to `/sign-in?callbackURL=%2Fdashboard` after sign-out.
- Request a password reset and complete it from the emailed link.
- Configure Google and GitHub credentials in the API env, then test each OAuth button from dashboard.
- Confirm production OAuth callbacks use `https://api.passway.co.in/api/auth/callback/google` and `https://api.passway.co.in/api/auth/callback/github`.

## Secure Runtime Secret Injection

### Install the CLI locally before publishing

From the Passway repository, build an installable package and install it globally:

```bash
npm pack ./packages/cli --pack-destination /tmp
npm install -g /tmp/passway-cli-0.1.0.tgz
passway --help
```

The build requires Bun; running the installed CLI requires Node.js 20.12 or newer. The installer
resolves the native OS keyring dependency for the destination machine. Linux
runtime device registration requires an accessible Secret Service keyring.

For a testing project connected to the local Passway API, run these commands
from that project's directory after enabling **Host Vault** in the dashboard:

```bash
export PASSWAY_API_URL=http://localhost:4000
passway start -- bun run dev
passway run
```

Keep the API running with `bun run dev:api` in the Passway repository. The testing
project must contain `.env` with `PASSWAY_TOKEN` and `.passway.json` with the
vault/environment `appId`. Sessions are created by the CLI automatically.
To persist a local API address across terminals, add `"apiUrl":
"http://localhost:4000"` to `.passway.json`. Successful `passway start` saves the
API address alongside the launch command. `PASSWAY_API_URL` takes priority when
explicitly set. Bare `passway` and `passway init` open/create the separate local
password manager; they do not connect to a hosted runtime vault.
Outside the Passway repository, the CLI defaults to the production API unless
`PASSWAY_API_URL` is set. After the package is published to npm, users can install
it with `npm install -g @passway/cli`.

A hosted environment can provide secrets to a local application without the dashboard ever requesting the plaintext bundle. Keep the one-time runtime token in the developer machine's local `.env` as `PASSWAY_TOKEN`, then set up the project once:

```bash
npm install -g @passway/cli
passway start
passway run
```

`passway start` verifies the linked `.passway.json` app, detects the existing launch command such as `npm run dev` or `bun run dev`, and saves that command as `launchCommand` without storing secrets. If detection is not possible, provide it once:

```bash
passway start -- node server.js
```

After setup, `passway run` authenticates directly to the Passway runtime API over HTTPS, creates a device-bound session, and fetches each vault value using the short-lived session token. If any fetch fails, the app does not start. The CLI removes `PASSWAY_TOKEN` and the session token from the child process environment and starts the saved command with the vault keys merged into `process.env`. The application can then read values normally:

```ts
const databaseUrl = process.env.DB_URL;
const stripeKey = process.env.STRIPE_KEY;
const jwtSecret = process.env.JWT_SECRET;
```

The dashboard and browser do not fetch runtime values. API responses are marked `no-store`, and the CLI does not save or print the fetched values. The values are still available to the running app and its dependencies in memory. A modified CLI or malicious dependency can copy them, and a leaked `PASSWAY_TOKEN` can authorize new sessions. Protect the local `.env`, rotate compromised tokens immediately, and never commit `PASSWAY_TOKEN`, `.env`, or secret values. The CLI warns when it cannot confirm that `.env` is ignored by Git. New runtime tokens expire after 30 days; older tokens with no expiry should be rotated. A token permits up to three concurrent sessions. Passway emails the token creator when a runtime session starts from an IP address that has not previously used that environment.

Startup fails closed: a missing value or failed live connection prevents the app from starting. After startup, a lost revocation WebSocket leaves the app running with a warning because its environment values are already in memory. Revocation stops the official CLI's child process and blocks future server requests, but cannot erase values already copied by a modified client. The CLI strips `PASSWAY_TOKEN` when launching the child; an app that independently loads the same `.env` file can read it again, so keep the token file private.

Passway currently wraps stored secret keys with a master key provided in the API server's environment. This is an environment-backed KMS stand-in, not a hardware or managed KMS: compromise of the API process or its environment can expose the master key. HTTPS encrypts runtime responses in transit; extra response encryption would not prevent local plaintext exposure because the CLI must decrypt the values before launching the app.

The CLI rejects remote HTTP API URLs. Production API requests redirect to the configured HTTPS origin and send HSTS. Set `BETTER_AUTH_URL` to the public HTTPS API origin and `PASSWAY_TRUST_PROXY_HOPS` to the exact number of trusted TLS proxy hops (zero for direct HTTPS). Runtime request limits use the shared Postgres `rateLimit` table, so every API instance must use the same database.

To rotate the environment-backed master key, keep the old version in `PASSWAY_MASTER_KEYS`, add a fresh 32-byte key under a new version, set `PASSWAY_ACTIVE_KEY_VERSION` to that version, and run `bun run --cwd apps/api keys:rotate`. The command rewraps stored data keys without reading secret plaintext. Back up the database and old keys first. Keep old keys until every stored row has the new version and a restore has been tested. A managed KMS remains the next storage-security milestone; the master keys currently reside in the API process environment.

Before deploying, fetch a unique canary secret through the CLI and search API, proxy, and hosting provider logs for the canary, runtime token, and session token. Confirm none appear in URLs, query strings, headers, or response-body logs. Passway has no hosted deployment yet, so this provider log check has not been run. The local canary test checks CLI request URLs and output only.

For a local Passway workspace, the API defaults to `http://localhost:4000`; for an installed CLI outside the workspace, it defaults to the production API unless `PASSWAY_API_URL` is set.

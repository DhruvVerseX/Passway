# Passway

Passway is a developer tool for managing application secrets and controlled access across projects and environments.

It is designed to help teams keep sensitive configuration out of source code, reduce manual secret sharing, and provide a cleaner way for services to access the values they need.

## Structure

- `apps/api` — Express API (`api.passway.co.in`)
- `apps/web` — marketing site and docs (`passway.co.in`, `/docs`)
- `apps/dashboard` — dashboard (`app.passway.co.in`)

## Local Development

```bash
bun install
cp .env.example .env
```

Run each surface in a separate terminal:

```bash
bun run dev:api        # http://localhost:4000
bun run dev:web        # http://localhost:3000
bun run dev:dashboard  # http://localhost:3001
```

Build frontends with `bun run build:frontends`.

The frontends currently use mock data only. Authentication and API integration
are intentionally not connected. The existing API source and storage behavior
remain unchanged.

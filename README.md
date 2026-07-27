# Passway

Passway is a developer tool for managing application secrets and controlled access across projects and environments.

It is designed to help teams keep sensitive configuration out of source code, reduce manual secret sharing, and provide a cleaner way for services to access the values they need.

## Structure

- `src` — existing Express API (`api.passway.co.in`)
- `apps/web` — marketing site (`passway.co.in`)
- `apps/app` — dashboard (`app.passway.co.in`)
- `apps/docs` — SDK docs (`docs.passway.co.in`)

## Local Development

```bash
bun install
cp .env.example .env
```

Run each surface in a separate terminal:

```bash
bun run dev:api   # http://localhost:4000
bun run dev:web   # http://localhost:3000
bun run dev:app   # http://localhost:3001
bun run dev:docs  # http://localhost:3002
```

Build all frontends with `bun run build:frontends`.

The frontends currently use mock data only. Authentication and API integration
are intentionally not connected. The existing API source and storage behavior
remain unchanged.

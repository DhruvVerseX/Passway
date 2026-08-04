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

## Dashboard Authentication Setup

Passway dashboard auth uses Better Auth 1.6, Neon PostgreSQL, Google OAuth, GitHub OAuth, email/password sign-in, email verification, password reset, and Resend transactional email.

1. Create a Neon PostgreSQL database and copy its pooled connection string into `DATABASE_URL`.
2. Generate a Better Auth secret with `openssl rand -base64 32` and set `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL` to `http://localhost:3001` locally and `https://app.passway.co.in` in production.
4. Create Google OAuth credentials and add these redirect URIs:
   - Local: `http://localhost:3001/api/auth/callback/google`
   - Production: `https://app.passway.co.in/api/auth/callback/google`
5. Create GitHub OAuth credentials and add these callback URLs:
   - Local: `http://localhost:3001/api/auth/callback/github`
   - Production: `https://app.passway.co.in/api/auth/callback/github`
6. Create a Resend API key, verify the `passway.co.in` sender domain, and set `RESEND_FROM_EMAIL` to `Passway <auth@passway.co.in>` or another verified sender.
7. Apply auth tables to Neon:

```bash
bun run --cwd apps/dashboard db:migrate
```

For manual SQL review, the initial migration is `apps/dashboard/drizzle/0000_better_auth.sql`.

### Production Environment Variables

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="https://app.passway.co.in"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
RESEND_API_KEY=""
RESEND_FROM_EMAIL="Passway <auth@passway.co.in>"
```

On Vercel or the current host, configure these variables only as server environment variables. Do not prefix secrets with `NEXT_PUBLIC_`.

### Manual Auth Checklist

- Run `bun run --cwd apps/dashboard db:migrate` against the Neon development database.
- Start `bun run dev:dashboard`.
- Register with name, email, and password.
- Confirm Resend sends a verification email.
- Verify the email and sign in.
- Visit `/dashboard` and `/projects` after sign-in.
- Sign out from the user menu.
- Confirm `/dashboard` redirects to `/sign-in?callbackURL=%2Fdashboard` after sign-out.
- Request a password reset and complete it from the emailed link.
- Configure Google and GitHub credentials, then test each OAuth button.
- Confirm production OAuth callbacks use `https://app.passway.co.in/api/auth/callback/google` and `https://app.passway.co.in/api/auth/callback/github`.

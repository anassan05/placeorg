# CampusConnect

CampusConnect is an early-stage multi-tenant college placement platform, **not production-ready**. This repository includes a public landing page, initial identity/RLS database foundation and an initial sign-in/sign-out slice. College onboarding, account invitations, password recovery, student management, placement workflows, reports, notifications and deployment hardening are not implemented. Do not use with real institutional data.

## Stack and public site

Next.js 15, React 19, strict TypeScript, Tailwind, PostgreSQL 16, Prisma, Vitest and Playwright; Node 22 is required.

```sh
npm ci
npm run dev
```

The public site is available without database configuration. `GET /api/health` is **liveness only**, not database readiness. `docker compose up -d` starts local PostgreSQL 16 with development-only credentials; it is not production configuration.

## Identity setup (development and review only)

1. An administrator creates the non-login roles using `prisma/admin/create-runtime-role.sql` and `prisma/admin/create-auth-role.sql` before migrations. These scripts reject pre-existing LOGIN roles; they are not intended to be rerun unchanged after login is enabled.
2. A separate migration identity deploys versioned SQL via `npx prisma migrate deploy`. An administrator applies `prisma/admin/grant-runtime-role.sql` and `prisma/admin/grant-auth-role.sql`. Only then are login credentials provisioned separately. This is security-sensitive and requires independent review before use.
3. Set `AUTH_DATABASE_URL` to the **separate auth-only login**, never a superuser or migration credential. Set `AUTH_RATE_LIMIT_SECRET` to a cryptographically random 32-byte hex value (e.g. `openssl rand -hex 32`) and `APP_ORIGIN` to the exact browser-facing origin. Production requires HTTPS; a proxy preview needs its actual public origin, not localhost. Do not commit `.env` files.
4. `npm run bootstrap:platform-admin -- admin@example.org` runs an interactive offline first-admin bootstrap. It requires `BOOTSTRAP_DATABASE_URL` for a separately controlled privileged identity and a terminal; passwords are entered without echo and must be 16–72 printable ASCII characters. It creates only the first platform admin and refuses a second. This is not account recovery, an audit system, or an invitation workflow. Do not run it against production without owner authorization and security review.

The sign-in page and workspace display the currently authenticated account only. Account and tenant management, password reset, email verification and platform/tenant workflows remain unfinished. No tenant-data endpoint exists. The auth role can read the minimum user identity columns across tenants, so its credentials and password hashes are especially sensitive; see `architecture/SECURITY.md`.

## Tests

```sh
npm run lint && npm run typecheck && npm test
npm run test:integration    # separately provisioned disposable PostgreSQL + test URLs
npm run build
npm run test:e2e            # Playwright Chromium and synthetic auth fixture required
npm audit --json
```

Integration tests require a disposable database named `campusconnect_test` with `TEST_ADMIN_DATABASE_URL`, `TEST_RUNTIME_DATABASE_URL`, `AUTH_DATABASE_URL`, `AUTH_RATE_LIMIT_SECRET`, and `APP_ORIGIN` set. The database-name check cannot prove that a database is disposable. E2E additionally needs a synthetic test account and `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`. CI provisions these test-only values. Never use real student data in tests.

See `IMPLEMENTATION_STATUS.md` for executed results and `architecture/SECURITY.md` for limitations. Never use `prisma db push`: it cannot recreate the custom RLS, constraints and role grants in migrations.

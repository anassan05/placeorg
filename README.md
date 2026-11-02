# CampusConnect

A college placement management platform in early development. This repository currently provides a public informational page, a liveness endpoint, and an **unreviewed, locally unverified** identity/tenant database foundation. It is not ready for institutional use or production deployment. There is no login, onboarding, student management, placement workflow, reporting, notification service, or tenant-data API.

## Stack

Next.js 15, React 19, strict TypeScript, Tailwind, PostgreSQL 16, Prisma, Vitest and Playwright. Node 22 is required.

## Run the public site

```sh
npm ci
npm run dev
```

Open http://localhost:3000. `GET /api/health` is **liveness only**; it does not check database readiness. The public page does not use the database. For preview environments the server listens on `0.0.0.0`.

## Database and tests

`docker compose up -d` starts a local development-only PostgreSQL service with explicitly local credentials. It is not production configuration. The versioned migration requires the unprivileged runtime role to exist first: an administrator runs `prisma/admin/create-runtime-role.sql`, a **separate migration identity** deploys migrations via `npx prisma migrate deploy`, then the administrator runs `prisma/admin/grant-runtime-role.sql`. A runtime login must be provisioned securely after the scripts; do not reuse the test credentials. Do not use `prisma db push`: custom constraints, policies and grants live in SQL migrations and scripts. This setup is awaiting real PostgreSQL verification and security review; do not use it with real personal data.

Integration tests require an isolated PostgreSQL database called `campusconnect_test`, `TEST_ADMIN_DATABASE_URL` (privileged synthetic-fixture writer) and `TEST_RUNTIME_DATABASE_URL` (restricted runtime role). The database name check reduces accidental misuse but cannot prove the database is disposable. CI provisions PostgreSQL 16 and test-only credentials. Never point these tests at real data.

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration    # requires separately provisioned disposable PostgreSQL
npm run build
npm run test:e2e            # requires Playwright Chromium
npm audit --json
```

See `IMPLEMENTATION_STATUS.md` for actual executed results and `architecture/SECURITY.md` for the trust boundary and outstanding risks.

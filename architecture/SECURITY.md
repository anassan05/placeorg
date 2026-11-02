# Security and tenant boundary

## Current trust model

This is an **unreviewed early authentication slice**, not a production security architecture. No tenant-data endpoints, invitation, account recovery, email verification, role administration, coordinator scope or institutional workflows exist. The permission matrix only permits a verified account to read its own session and denies all other actions; it is not complete product RBAC.

The initial SQL migration forces RLS on tenant tables, targets the restricted runtime role, and includes tenant/role and same-tenant creator constraints. NULL creator is allowed for a controlled bootstrap/import, not an audit trail. Runtime custom setting `app.college_id` is forgeable by runtime credentials. RLS helps catch accidental missing filters and pooled-connection leakage but is **not** independent authentication and does not protect against arbitrary SQL, SQL injection or stolen credentials. Tenant endpoints must derive the tenant from a verified current session, check resource-level authorization, use the transaction callback client and explicitly filter by that same tenant.

## Authentication design and remaining risks

The `campusconnect_auth` database role is separate from both migration and tenant runtime roles. Its intentionally cross-tenant SELECT policy on `users` exposes only `id`, `email`, `role` and `college_id`, so the authentication service can resolve and recheck identity—including platform users. It has no college-table access or tenant-user write access. It also reads password hashes and operates on sessions and per-identifier rate-limit records. This is **not** a platform administrator bypass: it is a highly sensitive cross-tenant identity capability; compromise could expose identity metadata and hashes and enable impersonation. Never reuse its credentials for tenant data or general administration. Role scripts fail on unsafe attributes, ownership, membership and key excessive privileges. They need independent security review and real PostgreSQL tests.

Passwords use bcrypt cost 12 for the first-admin bootstrap; sign-in rejects malformed or cost-below-12 hashes and inputs over bcrypt's 72-byte limit. Session cookies carry random 256-bit tokens; only SHA-256 token hashes are stored. Sessions have an eight-hour expiry, are deleted on logout, and recheck role and disabled credential state from the database on each access. Mutations require an exact configured Origin and use HttpOnly, SameSite=Strict cookies; production requires HTTPS and secure cookies. Errors are generic, login input is size-bounded, SQL is parameterized, and per-normalized-identifier attempts are atomically rate-limited in PostgreSQL using an HMAC key. `AUTH_RATE_LIMIT_SECRET` must be a randomly generated 32-byte hex key, not a committed value.

A privileged **offline first-admin bootstrap** is intentionally separate from web requests, only creates the first platform admin, and takes a password through an unechoed terminal. It requires a separately controlled role with BYPASSRLS/superuser for this one-time bootstrap. That elevated identity is not an app credential or a general platform bypass; provisioning, recovery, audit and operational separation still need independent design and review. No production database changes are authorized.

### Important unfinished security work

- No password change/reset, email verification, account invitation, user suspension UI, session-wide revocation, recovery, MFA or security audit logging. If an account is disabled and later re-enabled, old unexpired sessions become usable unless separately deleted; future suspension must atomically revoke sessions. No automated retention cleanup exists yet for expired sessions or rate-limit rows.
- Per-identifier rate limits do not prevent distributed attacks across many identifiers or storage exhaustion and can allow targeted account denial of service. A trusted-edge/IP/global rate limit and retention strategy are mandatory before public deployment.
- No student/tenant endpoints or protected business operations exist. Further tenant/resource-level authorization and coordinator scope must be implemented and tested before adding them.
- No review of server-side secrets lifecycle, reliable email delivery, private file storage, cross-tenant exports, application deployment, restore procedures, or full privacy/accessibility/legal requirements has occurred.

## Dependency audit (2026-11-02)

`npm audit --json` reported 17 affected packages: 14 moderate, 3 high, 0 critical. The three high entries derive from `prisma@6.19.3 -> @prisma/config@6.19.3 -> deepmerge-ts@7.1.5`, [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), stack exhaustion on recursive object graphs. Prisma is dev-only but is also an optional peer of production `@prisma/client`; `npm audit --omit=dev` reports the chain. Do not process untrusted Prisma configuration; isolate CI. This is a mitigation, not a fix. npm proposes Prisma 7.10.1 as a breaking major fix; evaluate client generation, migrations and PostgreSQL tests together before upgrading.

Next 15.5.28 pins an older PostCSS; an npm override selects 8.5.32. This exceeds Next's upstream pin, so reassess compatibility and remove when a compatible upstream fix is available. CI publishes an audit artifact but does not gate on findings; green CI is not a clean dependency audit.

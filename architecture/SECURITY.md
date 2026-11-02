# Security and tenant boundary

## Scope and threat model

No authentication or authorization exists, and the only API is a public liveness response. Do not expose tenant-data endpoints. The identity migration is unverified locally and must be reviewed and tested using real disposable PostgreSQL 16 before use.

The SQL migration enables and forces RLS on tenant tables, targets only `campusconnect_runtime`, fails closed when the tenant setting is absent, uses a role/tenant CHECK and a same-tenant creator foreign key. The creator may be NULL for a future controlled bootstrap or import; it is not an audit log. Platform users have no college and cannot be read by the tenant runtime role. A secure audited platform administrative access path has not been designed.

**Critical limitation:** `app.college_id` is a PostgreSQL custom setting and the runtime role can set it to any tenant. RLS can help catch accidental missing tenant filters and connection-pool leakage, but is not identity verification and does not defend against arbitrary SQL, SQL injection, or stolen runtime credentials. Before a tenant-data route exists, establish verified server-controlled identity, current database-backed authorization, trusted tenant derivation, centralized default-deny RBAC, explicit tenant filtering, and a transaction callback client for all tenant queries. Students and coordinators additionally require resource/scope-level authorization. Avoid privileged platform-wide bypasses.

The pre-migration role script creates a NOLOGIN role and rejects an existing login or unsafe attributes/membership. The post-migration grant script rejects runtime ownership, schema CREATE, unsafe attributes, membership and excessive table/column privileges. The migration owner and runtime login must be separate. Production identity provisioning, revocation, secrets management and auditing are not designed yet. CI credentials are disposable test-only values.

## Dependency audit (2026-11-02)

`npm audit --json` reported 17 affected packages (14 moderate, 3 high, 0 critical). The three high entries all stem from one advisory: `prisma@6.19.3 -> @prisma/config@6.19.3 -> deepmerge-ts@7.1.5`, [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), stack exhaustion on recursive object graphs. Prisma is declared dev-only but is also an optional peer of the production `@prisma/client`; `npm audit --omit=dev` still reports this chain. Do not process untrusted Prisma configuration; isolate CI and development environments. This is a mitigation, not a fix. npm proposes Prisma 7.10.1 as a breaking major fix; evaluate client generation, migrations and full PostgreSQL tests together before upgrading. Audit moderate findings and installed production artifacts as well before deployment.

Next 15.5.28 pins a vulnerable older PostCSS; an npm override selects 8.5.32. This overrides Next's upstream pin and is only supported by the local checks recorded in the status file; reassess compatibility and remove it when a compatible upstream fix is available. CI saves an audit artifact but does not gate on advisory counts; successful CI will not imply an audit-clean release.

## Privacy and release

No collection forms, cookies for authentication, tracking SDKs, payments, marketing or uploads are implemented. Actual privacy, terms, refund and cookie policies, consent/age requirements, data retention/deletion, legal business details, accessibility verification, and provider/security review must be completed for the real product and jurisdiction with owner/legal input. Do not publish invented terms or claim compliance based on the landing page.

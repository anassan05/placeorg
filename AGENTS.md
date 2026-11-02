# CampusConnect agent instructions

- Do not claim a feature is implemented, tested, secure or deployable without evidence.
- Preserve the multi-tenant RLS boundary; the runtime role can forge its custom GUC, so it is not an authentication mechanism.
- Before tenant data APIs, implement verified server-side identity, current authorization, trusted tenant derivation, a centralized default-deny permission matrix and explicit tenant filters within transaction clients. Never trust client tenant IDs or UI role checks.
- Use versioned migrations and separate migration/runtime identities. Do not run destructive database commands or touch production data without authorization.
- Use synthetic data only. Never commit secrets or personal records. Never force-push or self-merge.
- Eligibility and selection decisions must be deterministic; AI must never make them.
- Record actual tests and limitations in IMPLEMENTATION_STATUS.md. Keep each milestone reviewable.

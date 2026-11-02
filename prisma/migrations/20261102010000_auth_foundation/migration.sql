-- The auth role is intentionally a separate identity-only role, not a platform-admin bypass.
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users" (lower("email"));
CREATE TABLE "auth_credentials" (
  "user_id" UUID NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "password_hash" TEXT NOT NULL,
  "disabled_at" TIMESTAMPTZ(3)
);
CREATE TABLE "auth_sessions" (
  "token_hash" TEXT NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "auth_credentials"("user_id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "session_expiry_check" CHECK ("expires_at" > "created_at")
);
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id");
CREATE TABLE "auth_rate_limits" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "started_at" TIMESTAMPTZ(3) NOT NULL,
  "attempts" INTEGER NOT NULL CHECK ("attempts" > 0)
);
REVOKE ALL ON "auth_credentials", "auth_sessions", "auth_rate_limits" FROM PUBLIC;
-- Only the authentication identity can look up these minimal user columns across tenants.
CREATE POLICY "users_auth_lookup" ON "users" FOR SELECT TO campusconnect_auth USING (true);

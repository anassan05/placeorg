import { createHash, createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { authConfig } from "./config";
import { emailSchema, passwordIsValidInput } from "./password";

export type Role = "PLATFORM_SUPER_ADMIN" | "COLLEGE_ADMIN" | "PLACEMENT_OFFICER" | "COORDINATOR" | "STUDENT";
export type Actor = { id: string; email: string; role: Role; collegeId: string | null };
export const SESSION_COOKIE = "campusconnect_session";
export const SESSION_SECONDS = 8 * 60 * 60;
// Fixed invalid-account hash at the same cost as new accounts. Not a credential.
const FAKE_HASH = "$2b$12$eKmCouLxiFUBIWfZ0q/9o8RWLOq4TVM6GlAUxaH9MF3YgBORKC";
let pool: Pool | undefined;
function authPool() {
  if (!pool) pool = new Pool({ connectionString: authConfig().databaseUrl, max: 5, connectionTimeoutMillis: 5000 });
  return pool;
}
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function newToken() { return randomBytes(32).toString("base64url"); }
export function isToken(token: string) { return /^[A-Za-z0-9_-]{43}$/.test(token); }
export function sameOrigin(origin: string | null): boolean {
  return origin !== null && origin === authConfig().origin;
}
export async function authenticate(emailInput: string, password: string): Promise<string | null> {
  const email = emailSchema.safeParse(emailInput);
  if (!email.success || !passwordIsValidInput(password)) return null;
  const { rateLimitSecret } = authConfig();
  const key = createHmac("sha256", Buffer.from(rateLimitSecret, "hex")).update(email.data).digest("hex");
  // A single atomic row update serializes concurrent attempts for each account identifier.
  const rate = await authPool().query<{ attempts: number }>(`
    INSERT INTO auth_rate_limits (key, started_at, attempts) VALUES ($1, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      started_at = CASE WHEN auth_rate_limits.started_at <= now() - interval '15 minutes' THEN now() ELSE auth_rate_limits.started_at END,
      attempts = CASE WHEN auth_rate_limits.started_at <= now() - interval '15 minutes' THEN 1 ELSE auth_rate_limits.attempts + 1 END
    RETURNING attempts`, [key]);
  if (rate.rows[0].attempts > 10) return null;
  const result = await authPool().query<{ id: string; password_hash: string; disabled_at: Date | null }>(`
    SELECT u.id, c.password_hash, c.disabled_at FROM users u JOIN auth_credentials c ON c.user_id = u.id
    WHERE lower(u.email) = $1`, [email.data]);
  const account = result.rows[0];
  const hash = account?.password_hash;
  // Refuse weak or malformed stored hashes rather than weakening the password policy.
  const usableHash = hash && /^\$2[aby]\$(1[2-9]|2[0-9]|3[01])\$[./A-Za-z0-9]{53}$/.test(hash) ? hash : FAKE_HASH;
  const matches = await bcrypt.compare(password, usableHash);
  if (!account || !matches || !hash || usableHash !== hash || account.disabled_at !== null) return null;
  const token = newToken();
  // Recheck disabled_at in the INSERT, so a concurrent suspension cannot create a usable session.
  const inserted = await authPool().query(`INSERT INTO auth_sessions (token_hash,user_id,expires_at)
    SELECT $1, user_id, now() + ($2 * interval '1 second') FROM auth_credentials WHERE user_id=$3 AND disabled_at IS NULL RETURNING user_id`, [hashToken(token), SESSION_SECONDS, account.id]);
  if (!inserted.rowCount) return null;
  await authPool().query("DELETE FROM auth_rate_limits WHERE key=$1", [key]);
  return token;
}
export async function currentActor(token: string | undefined): Promise<Actor | null> {
  if (!token || !isToken(token)) return null;
  const result = await authPool().query<{ id: string; email: string; role: Role; college_id: string | null }>(`
    SELECT u.id, u.email, u.role, u.college_id FROM auth_sessions s
    JOIN auth_credentials c ON c.user_id=s.user_id
    JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at > now() AND c.disabled_at IS NULL`, [hashToken(token)]);
  const row = result.rows[0];
  return row ? { id: row.id, email: row.email, role: row.role, collegeId: row.college_id } : null;
}
export async function revokeSession(token: string | undefined) {
  if (token && isToken(token)) await authPool().query("DELETE FROM auth_sessions WHERE token_hash=$1", [hashToken(token)]);
}

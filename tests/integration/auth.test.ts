import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authenticate, currentActor, revokeSession } from "../../src/lib/auth/session";

const adminUrl = process.env.TEST_ADMIN_DATABASE_URL;
const authUrl = process.env.AUTH_DATABASE_URL;
if (!adminUrl || !authUrl || new URL(adminUrl).pathname !== "/campusconnect_test" || new URL(authUrl).pathname !== "/campusconnect_test") throw new Error("Use only an isolated campusconnect_test database for integration tests.");
const admin = new Client({ connectionString: adminUrl });
const restricted = new Client({ connectionString: authUrl });
const college = randomUUID(), user = randomUUID();
const email = `${user}@example.test`;
const password = "correct-horse-battery-staple"; // synthetic test fixture only
beforeAll(async () => {
  await admin.connect(); await restricted.connect();
  await admin.query('INSERT INTO colleges (id,name) VALUES ($1,$2)', [college,"Auth test"]);
  await admin.query('INSERT INTO users (id,email,role,college_id) VALUES ($1,$2,$3,$4)', [user,email,"STUDENT",college]);
  await admin.query('INSERT INTO auth_credentials (user_id,password_hash) VALUES ($1,$2)', [user, await bcrypt.hash(password, 12)]);
});
afterAll(async () => { await admin.end(); await restricted.end(); });
describe("database-backed authentication", () => {
  it("rejects wrong credentials and creates a hashed, revocable session", async () => {
    expect(await authenticate(email, "wrong-password")).toBeNull();
    const token = await authenticate(email.toUpperCase(), password);
    expect(token).not.toBeNull();
    expect(await currentActor(token!)).toMatchObject({ id: user, email, role: "STUDENT", collegeId: college });
    expect((await admin.query('SELECT token_hash FROM auth_sessions WHERE user_id=$1',[user])).rows[0].token_hash).not.toBe(token);
    await revokeSession(token!);
    expect(await currentActor(token!)).toBeNull();
  });
  it("rechecks account status and role on every request", async () => {
    const token = await authenticate(email, password);
    expect(token).not.toBeNull();
    await admin.query('UPDATE users SET role=$1 WHERE id=$2',["COORDINATOR",user]);
    expect((await currentActor(token!))?.role).toBe("COORDINATOR");
    await admin.query('UPDATE auth_credentials SET disabled_at=now() WHERE user_id=$1',[user]);
    expect(await currentActor(token!)).toBeNull();
    await admin.query('UPDATE auth_credentials SET disabled_at=NULL WHERE user_id=$1',[user]);
    await revokeSession(token!);
  });
  it("rejects expired sessions and malformed tokens", async () => {
    const token = await authenticate(email, password);
    await admin.query("UPDATE auth_sessions SET expires_at = now() - interval '23 hours', created_at = now() - interval '1 day' WHERE user_id=$1",[user]);
    expect(await currentActor(token!)).toBeNull();
    expect(await currentActor("not-a-valid-token")).toBeNull();
  });
  it("rate limits repeated failures by identifier", async () => {
    const limited = `${randomUUID()}@example.test`;
    for (let i = 0; i < 11; i++) expect(await authenticate(limited, "wrong-password")).toBeNull();
    // The 11th attempt is persisted but rejected before expensive password comparison.
    const rows = await admin.query("SELECT max(attempts) AS n FROM auth_rate_limits");
    expect(rows.rows[0].n).toBeGreaterThanOrEqual(11);
  }, 30000);
  it("allows only restricted identity lookup, not tenant-data modification", async () => {
    const r = await restricted.query("SELECT has_table_privilege(current_user,'public.users','SELECT') AS all_users, has_column_privilege(current_user,'public.users','email','SELECT') AS email, has_column_privilege(current_user,'public.users','created_by_user_id','SELECT') AS creator, has_table_privilege(current_user,'public.colleges','SELECT') AS colleges, has_table_privilege(current_user,'public.users','UPDATE') AS update_user, has_table_privilege(current_user,'public.auth_credentials','UPDATE') AS update_password");
    expect(r.rows[0]).toEqual({ all_users: false, email: true, creator: false, colleges: false, update_user: false, update_password: false });
  });
});

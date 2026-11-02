import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Explicitly refuse to run against anything except a named disposable test database.
const adminUrl = process.env.TEST_ADMIN_DATABASE_URL;
const runtimeUrl = process.env.TEST_RUNTIME_DATABASE_URL;
if (!adminUrl || !runtimeUrl || new URL(adminUrl).pathname !== "/campusconnect_test" || new URL(runtimeUrl).pathname !== "/campusconnect_test") {
  throw new Error("Integration tests require TEST_ADMIN_DATABASE_URL and TEST_RUNTIME_DATABASE_URL pointing to a disposable campusconnect_test database.");
}
const admin = new Client({ connectionString: adminUrl });
const pool = new Pool({ connectionString: runtimeUrl, max: 1 });
const a = randomUUID(), b = randomUUID(), userA = randomUUID(), userB = randomUUID();

beforeAll(async () => {
  await admin.connect();
  // Seed through a privileged test-only fixture writer; FORCE RLS also applies to normal owners.
  await admin.query('INSERT INTO colleges (id, name) VALUES ($1, $2), ($3, $4)', [a, "Test A", b, "Test B"]);
  await admin.query('INSERT INTO users (id, email, role, college_id) VALUES ($1,$2,$3,$4),($5,$6,$7,$8)', [userA, `${userA}@example.test`, "STUDENT", a, userB, `${userB}@example.test`, "STUDENT", b]);
});
afterAll(async () => { await pool.end(); await admin.end(); });

describe("PostgreSQL tenant defenses", () => {
  it("fails closed without a tenant context", async () => {
    expect((await pool.query('SELECT id FROM users WHERE id = ANY($1::uuid[])', [[userA, userB]])).rowCount).toBe(0);
  });
  it("filters reads and prevents writes across tenants", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.college_id', $1, true)", [a]);
      const rows = await client.query('SELECT id FROM users WHERE id = ANY($1::uuid[])', [[userA, userB]]);
      expect(rows.rows).toEqual([{ id: userA }]);
      await expect(client.query('INSERT INTO users (id,email,role,college_id) VALUES ($1,$2,$3,$4)', [randomUUID(), `${randomUUID()}@example.test`, "STUDENT", b])).rejects.toMatchObject({ code: "42501" });
      await client.query("ROLLBACK");
    } finally { client.release(); }
  });
  it("prevents same-tenant records from referencing a different-tenant creator", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.college_id', $1, true)", [a]);
      await expect(client.query('INSERT INTO users (id,email,role,college_id,created_by_user_id) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), `${randomUUID()}@example.test`, "STUDENT", a, userB])).rejects.toMatchObject({ code: "23503" });
      await client.query("ROLLBACK");
    } finally { client.release(); }
  });
  it("clears transaction-local settings on pooled connection reuse after commit and rollback", async () => {
    const client = await pool.connect();
    try {
      for (const ending of ["COMMIT", "ROLLBACK"]) {
        await client.query("BEGIN");
        await client.query("SELECT set_config('app.college_id', $1, true)", [a]);
        expect((await client.query('SELECT id FROM users WHERE id=$1', [userA])).rowCount).toBe(1);
        await client.query(ending);
        expect((await client.query('SELECT id FROM users WHERE id=$1', [userA])).rowCount).toBe(0);
      }
    } finally { client.release(); }
  });
  it("documents that the runtime can forge its own tenant context", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.college_id', $1, true)", [b]);
      expect((await client.query('SELECT id FROM users WHERE id=$1', [userB])).rowCount).toBe(1);
      await client.query("ROLLBACK");
    } finally { client.release(); }
  });
  it("enforces role and tenant constraints even for a privileged writer", async () => {
    await expect(admin.query('INSERT INTO users (id,email,role) VALUES ($1,$2,$3)', [randomUUID(), `${randomUUID()}@example.test`, "STUDENT"])).rejects.toMatchObject({ code: "23514" });
  });
  it("uses forced RLS with policies scoped to the restricted runtime role", async () => {
    const r = await pool.query("SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, pg_get_userbyid(c.relowner) AS owner FROM pg_class c WHERE c.oid IN ('public.colleges'::regclass, 'public.users'::regclass)");
    expect(r.rowCount).toBe(2);
    for (const row of r.rows) expect(row).toMatchObject({ relrowsecurity: true, relforcerowsecurity: true });
    for (const row of r.rows) expect(row.owner).not.toBe("campusconnect_runtime");
    const policies = await pool.query("SELECT roles::text AS roles, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename IN ('users','colleges') AND policyname != 'users_auth_lookup'");
    expect(policies.rowCount).toBe(2);
    for (const row of policies.rows) { expect(row.roles).toEqual("{campusconnect_runtime}"); expect(row.qual).toContain("app.college_id"); expect(row.with_check).toContain("app.college_id"); }
  });
  it("rejects an existing LOGIN role in the pre-migration script", async () => {
    const script = await readFile("prisma/admin/create-runtime-role.sql", "utf8");
    await expect(admin.query(script)).rejects.toThrow("must be NOLOGIN");
    expect((await admin.query("SELECT rolcanlogin FROM pg_roles WHERE rolname='campusconnect_runtime'")).rows[0].rolcanlogin).toBe(true);
  });
  it("denies schema creation and excessive privileges to the runtime role", async () => {
    const r = await pool.query("SELECT current_user AS role, has_schema_privilege(current_user,'public','CREATE') AS create, has_table_privilege(current_user,'public.colleges','INSERT') AS college_insert, has_table_privilege(current_user,'public.users','TRUNCATE') AS user_truncate, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user");
    expect(r.rows[0]).toEqual({ role: "campusconnect_runtime", create: false, college_insert: false, user_truncate: false, rolsuper: false, rolbypassrls: false });
  });
});

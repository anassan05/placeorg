// Synthetic CI fixtures only. Never use against any real institutional database.
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
const url = process.env.TEST_ADMIN_DATABASE_URL;
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
if (process.env.CI !== "true" || !url || new URL(url).pathname !== "/campusconnect_test" || !email || !password) throw new Error("Disposable CI database and synthetic credentials required");
const db = new pg.Client({ connectionString: url });
await db.connect();
try {
  const id = randomUUID();
  await db.query("INSERT INTO users (id,email,role) VALUES ($1,$2,'PLATFORM_SUPER_ADMIN')", [id, email]);
  await db.query("INSERT INTO auth_credentials (user_id,password_hash) VALUES ($1,$2)", [id, await bcrypt.hash(password, 12)]);
} finally { await db.end(); }

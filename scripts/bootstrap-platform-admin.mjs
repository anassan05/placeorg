/** Privileged offline bootstrap only. Never used by a public request. */
import { randomUUID } from "node:crypto";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import pg from "pg";
import { z } from "zod";

const email = z.string().trim().max(254).email().transform(v => v.toLowerCase()).safeParse(process.argv[2]);
if (!email.success || process.argv.length !== 3 || !process.env.BOOTSTRAP_DATABASE_URL) {
  console.error("Usage: BOOTSTRAP_DATABASE_URL=... node scripts/bootstrap-platform-admin.mjs admin@example.org");
  process.exit(1);
}
if (!stdin.isTTY || !stdout.isTTY) {
  console.error("Interactive terminal required; do not provide passwords via arguments, environment, or files.");
  process.exit(1);
}
function promptSecret(label) {
  return new Promise((resolve, reject) => {
    const bytes = [];
    stdout.write(label);
    stdin.setRawMode(true); stdin.resume();
    const cleanup = () => { stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); stdout.write("\n"); };
    function onData(chunk) {
      for (const byte of chunk) {
        if (byte === 3) { cleanup(); reject(new Error("Cancelled")); return; }
        if (byte === 13 || byte === 10) { cleanup(); resolve(Buffer.from(bytes).toString("utf8")); return; }
        if (byte === 127 || byte === 8) { bytes.pop(); continue; }
        if (byte < 32 || byte > 126 || bytes.length >= 72) { cleanup(); reject(new Error("Use 16–72 printable ASCII characters")); return; }
        bytes.push(byte);
      }
    }
    stdin.on("data", onData);
  });
}
let client;
try {
  const password = await promptSecret("New platform administrator password (input hidden): ");
  if (password.length < 16 || password.length > 72) throw new Error("Use 16–72 printable ASCII characters");
  const confirmation = await promptSecret("Confirm password (input hidden): ");
  if (password !== confirmation) throw new Error("Passwords do not match");
  const hash = await bcrypt.hash(password, 12);
  client = new pg.Client({ connectionString: process.env.BOOTSTRAP_DATABASE_URL });
  await client.connect();
  await client.query("BEGIN");
  const privilege = await client.query("SELECT rolsuper OR rolbypassrls AS privileged FROM pg_roles WHERE rolname=current_user");
  if (!privilege.rows[0]?.privileged) throw new Error("Bootstrap requires a separately controlled, explicitly privileged identity");
  await client.query("SELECT pg_advisory_xact_lock($1)", [845771024]);
  const existing = await client.query("SELECT 1 FROM users WHERE role='PLATFORM_SUPER_ADMIN' LIMIT 1");
  if (existing.rowCount) throw new Error("A platform administrator already exists; use a separately reviewed recovery procedure");
  const id = randomUUID();
  await client.query('INSERT INTO users (id,email,role) VALUES ($1,$2,$3)', [id, email.data, "PLATFORM_SUPER_ADMIN"]);
  await client.query("INSERT INTO auth_credentials (user_id,password_hash) VALUES ($1,$2)", [id, hash]);
  await client.query("COMMIT");
  console.log("Initial platform administrator created. Securely dispose of bootstrap access.");
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  console.error(error instanceof Error ? error.message : "Bootstrap failed");
  process.exitCode = 1;
} finally {
  if (client) await client.end().catch(() => {});
}

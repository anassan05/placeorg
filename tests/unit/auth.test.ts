import { describe, expect, it } from "vitest";
import { can } from "../../src/lib/auth/permissions";
import { emailSchema, passwordIsStrongEnough, passwordIsValidInput } from "../../src/lib/auth/password";
import { hashToken, isToken, newToken } from "../../src/lib/auth/session";
import { readLoginBody } from "../../src/lib/auth/request";

describe("authentication primitives", () => {
  it("normalizes and validates identifiers", () => {
    expect(emailSchema.parse("  A@EXAMPLE.TEST ")).toBe("a@example.test");
    expect(emailSchema.safeParse("bad address").success).toBe(false);
  });
  it("enforces password minimum and bcrypt byte boundary", () => {
    expect(passwordIsStrongEnough("short")).toBe(false);
    expect(passwordIsStrongEnough("long-enough-password")).toBe(true);
    expect(passwordIsValidInput("😀".repeat(19))).toBe(false);
    expect(passwordIsValidInput("x".repeat(72))).toBe(true);
    expect(passwordIsValidInput("x".repeat(73))).toBe(false);
  });
  it("creates unguessable-form tokens and stores a distinct stable digest", () => {
    const token = newToken();
    expect(isToken(token)).toBe(true);
    expect(newToken()).not.toBe(token);
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).not.toBe(token);
  });
  it("denies unknown actions and malformed actor scopes", () => {
    expect(can(null, "session:read")).toBe(false);
    const student = { id: "student", email: "a@example.test", role: "STUDENT" as const, collegeId: "college" };
    expect(can(student, "session:read")).toBe(true);
    expect(can(student, "drive:delete")).toBe(false);
    expect(can({ ...student, collegeId: null }, "session:read")).toBe(false);
    expect(can({ ...student, role: "PLATFORM_SUPER_ADMIN", collegeId: "college" }, "session:read")).toBe(false);
    expect(can({ ...student, role: "PLATFORM_SUPER_ADMIN", collegeId: null }, "session:read")).toBe(true);
  });
  it("limits login body content type and size", async () => {
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    expect((await readLoginBody(new Request("http://example.test", { method:"POST", headers, body:"email=a%40b.test&password=secret" })))?.get("email")).toBe("a@b.test");
    expect(await readLoginBody(new Request("http://example.test", { method:"POST", headers, body:"a=" + "x".repeat(5000) }))).toBeNull();
    expect(await readLoginBody(new Request("http://example.test", { method:"POST", body:"test" }))).toBeNull();
  });
});

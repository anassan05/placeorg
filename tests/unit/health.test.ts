import { describe, expect, it } from "vitest";
import { GET } from "../../src/app/api/health/route";
describe("liveness endpoint", () => {
  it("reports liveness without claiming database readiness and disables caching", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

import { test, expect } from "@playwright/test";
test("a provisioned user can sign in and revoke their session", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL, password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) throw new Error("Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for a synthetic account in a disposable database");
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole("button", { name: /Sign out/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login$/);
});
test("cross-origin sign-in is rejected", async ({ request }) => {
  const response = await request.post("/api/auth/login", { headers: { origin: "https://attacker.example", "content-type": "application/x-www-form-urlencoded" }, data: "email=test%40example.test&password=anything" });
  expect(response.status()).toBe(403);
});

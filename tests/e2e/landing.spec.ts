import { test, expect } from "@playwright/test";
test("landing navigation communicates current status", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Better placements/ })).toBeVisible();
  await page.getByRole("link", { name: "Project status" }).click();
  await expect(page.getByText(/College onboarding, accounts/)).toBeVisible();
  await expect(page.getByRole("link", { name: /View liveness endpoint/ })).toHaveAttribute("href", "/api/health");
});
test("mobile landing stays within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

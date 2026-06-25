import { test, expect } from "@playwright/test";

test.describe("Marketplace browsing (public)", () => {
  test("Marketplace page loads with products grid", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { name: /marketplace/i })).toBeVisible();
    // Category pills should be present
    await expect(page.getByText(/furniture/i)).toBeVisible();
  });

  test("Category filter works", async ({ page }) => {
    await page.goto("/marketplace");
    await page.getByRole("button", { name: /furniture/i }).click();
    await expect(page.getByText(/found/i)).toBeVisible({ timeout: 5_000 });
  });

  test("Artisans browse page loads", async ({ page }) => {
    await page.goto("/artisans");
    await expect(page.getByRole("heading", { name: /artisan/i })).toBeVisible();
  });

  test("Job requests page loads", async ({ page }) => {
    await page.goto("/job-requests");
    await expect(page.getByRole("heading", { name: /job request/i })).toBeVisible();
  });

  test("Designer listing page loads", async ({ page }) => {
    await page.goto("/designers");
    await expect(page.getByRole("heading", { name: /designer/i })).toBeVisible();
  });
});

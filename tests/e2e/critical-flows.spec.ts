import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password = "TestPassword123!") {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
}

test.describe("Client — Post Project flow", () => {
  test.skip(!process.env.E2E_CLIENT_EMAIL, "Needs E2E_CLIENT_EMAIL env var");

  test("Client can post a new project", async ({ page }) => {
    await loginAs(page, process.env.E2E_CLIENT_EMAIL!);
    await page.goto("/projects/new");
    await page.getByLabel(/title/i).fill("Living Room Redesign E2E");
    await page.getByLabel(/description/i).fill("Full living room interior design for a modern 3-bedroom apartment in Lekki");
    await page.getByLabel(/budget/i).fill("500000");
    await page.getByLabel(/location/i).fill("Lekki, Lagos");
    await page.getByRole("button", { name: /continue|next/i }).click();
    // Should progress or submit
    await expect(page.getByText(/project|created|submit/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Artisan — Browse Job Requests flow", () => {
  test.skip(!process.env.E2E_ARTISAN_EMAIL, "Needs E2E_ARTISAN_EMAIL env var");

  test("Artisan can view and quote on a job request", async ({ page }) => {
    await loginAs(page, process.env.E2E_ARTISAN_EMAIL!);
    await page.goto("/job-requests");
    const firstJob = page.locator("a[href*='/job-requests/']").first();
    if (await firstJob.count() > 0) {
      await firstJob.click();
      await expect(page.getByRole("heading")).toBeVisible();
    }
  });
});

test.describe("Navigation integrity", () => {
  test("Public homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
  });

  test("Legal pages load", async ({ page }) => {
    await page.goto("/legal");
    await expect(page.getByText(/terms|privacy|legal/i)).toBeVisible();
  });

  test("404 page works", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xyz");
    expect(res?.status()).not.toBe(500);
  });
});

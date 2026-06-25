import { test, expect } from "@playwright/test";

const TIMESTAMP = Date.now();
const TEST_EMAIL    = `e2e-${TIMESTAMP}@designhubtest.com`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_NAME     = { first: "E2E", last: "Tester" };

test.describe("Authentication flows", () => {
  test("Register as a client", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/first name/i).fill(TEST_NAME.first);
    await page.getByLabel(/last name/i).fill(TEST_NAME.last);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    // Select CLIENT role
    await page.getByRole("radio", { name: /client/i }).click().catch(() =>
      page.locator('[data-role="CLIENT"]').click()
    );
    // Accept terms
    await page.getByRole("checkbox").check().catch(() => {});
    await page.getByRole("button", { name: /get started|register|sign up/i }).click();
    // Should land on dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("Login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("Login rejects wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5_000 });
  });

  test("Protected route redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login|auth/, { timeout: 5_000 });
  });
});

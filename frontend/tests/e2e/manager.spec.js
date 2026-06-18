import { test, expect } from '@playwright/test';

test.describe('Manager Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'manager@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manager\/dashboard/);
  });

  test('7. Manager flow - Dashboard stats', async ({ page }) => {
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Assigned Sites')).toBeVisible();
    await expect(page.locator('text=Team Size')).toBeVisible();
  });

  test('7. Manager flow - Site View & Team', async ({ page }) => {
    await page.click('text=Site View');
    await expect(page).toHaveURL(/\/manager\/sites/);

    await page.click('text=Team');
    await expect(page).toHaveURL(/\/manager\/team/);

    // Create staff from team page
    await page.click('text=Create Staff');
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Manager Staff Playwright');
      await page.fill('input[name="email"]', `mstaff${Date.now()}@example.com`);
      await page.fill('input[name="mobile"]', '1122334455');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
    }
  });

  test('7. Manager flow - Approvals', async ({ page }) => {
    await page.click('text=Transactions');
    // Try to find pending manager requests
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
    }
  });
});

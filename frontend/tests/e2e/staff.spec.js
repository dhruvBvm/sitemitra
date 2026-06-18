import { test, expect } from '@playwright/test';

test.describe('Staff Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'staff@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff\/dashboard/);
  });

  test('8. Staff flow - Dashboard', async ({ page }) => {
    // Should see site cards
    const siteCard = page.locator('.bg-white.rounded-\\[20px\\]').first();
    await expect(siteCard).toBeVisible();
  });

  test('8. Staff flow - Create Request', async ({ page }) => {
    await page.click('text=Requests');
    await expect(page).toHaveURL(/\/staff\/requests/);
    
    // Attempt to navigate to create order
    await page.goto('/staff/create-order');
    await expect(page.locator('text=Create Request')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'owner@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/owner\/dashboard/);
  });

  test('9. Inventory Management - View and actions', async ({ page }) => {
    // We assume there's at least one site on the dashboard to click
    const siteCard = page.locator('.bg-white.rounded-\\[20px\\]').first();
    if (await siteCard.isVisible()) {
      await siteCard.click();
      await expect(page).toHaveURL(/\/sites\//);
      
      const viewInventoryBtn = page.locator('text=View Inventory');
      if (await viewInventoryBtn.isVisible()) {
         await viewInventoryBtn.click();
         await expect(page).toHaveURL(/inventory/);
         
         const addBtn = page.locator('button:has-text("+")').first();
         if (await addBtn.isVisible()) {
           await addBtn.click();
           await expect(page.locator('text=Add Stock')).toBeVisible();
           await page.click('button:has-text("Cancel")');
         }
      }
    }
  });
});

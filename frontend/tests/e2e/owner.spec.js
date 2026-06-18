import { test, expect } from '@playwright/test';

test.describe('Owner Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'owner@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/owner\/dashboard/);
  });

  test('2. Owner dashboard - Stats cards, Navigation, Sites list', async ({ page }) => {
    // Stats cards
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Total Sites')).toBeVisible();
    
    // Click Pending Approvals
    await page.click('text=Pending Approvals');
    await expect(page).toHaveURL(/transactions\?status=pending_owner|transactions/);
    
    // Bottom nav Transactions
    await page.goto('/owner/dashboard');
    await page.click('text=Transactions');
    await expect(page).toHaveURL(/\/owner\/transactions/);
  });

  test('3. Owner – Site Management', async ({ page }) => {
    await page.click('text=Sites');
    await expect(page).toHaveURL(/\/owner\/sites/);

    // Create Site
    await page.click('text=Create Site');
    await page.fill('input[name="siteName"]', 'Test Site Playwright');
    await page.fill('input[name="siteCode"]', 'TSP-01');
    await page.fill('input[name="address"]', 'Test Address');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Site Playwright').first()).toBeVisible();

    // Edit Site
    const editBtn = page.locator('text=Test Site Playwright').locator('..').locator('button').filter({ hasText: 'Edit' }).first();
    if(await editBtn.isVisible()) {
      await editBtn.click();
      await page.fill('input[name="siteName"]', 'Test Site Edited');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Test Site Edited').first()).toBeVisible();
    }
  });

  test('4. Owner – User Management', async ({ page }) => {
    await page.click('text=Users');
    await expect(page).toHaveURL(/\/owner\/users/);

    // Create Manager
    await page.click('text=Create Manager');
    await page.fill('input[name="name"]', 'Test Manager');
    await page.fill('input[name="email"]', `testmanager${Date.now()}@example.com`);
    await page.fill('input[name="mobile"]', '1234567890');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Manager').first()).toBeVisible();

    // Create Staff
    await page.click('text=Create Staff');
    await page.fill('input[name="name"]', 'Test Staff');
    await page.fill('input[name="email"]', `teststaff${Date.now()}@example.com`);
    await page.fill('input[name="mobile"]', '0987654321');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('5. Owner – Material Management', async ({ page }) => {
    await page.click('text=Materials');
    await expect(page).toHaveURL(/\/owner\/materials/);

    // Create Material
    await page.click('text=Create Material');
    await page.fill('input[name="name"]', 'Test Material Playwright');
    await page.fill('input[name="unit"]', 'KG');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Material Playwright').first()).toBeVisible();
  });

  test('6. Owner – Transactions & Approvals', async ({ page }) => {
    await page.click('text=Transactions');
    // Try to find pending owner requests
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // wait for modal or confirm
      const confirmBtn = page.locator('.modal-content button:has-text("Approve")').first();
      if(await confirmBtn.isVisible()) await confirmBtn.click();
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('1. Authentication', () => {
  test('Owner login with valid credentials -> redirects to /owner/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'owner@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/owner\/dashboard/);
  });

  test('Manager login -> redirects to /manager/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'manager@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/manager\/dashboard/);
  });

  test('Staff login -> redirects to /staff/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'staff@example.com');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/staff\/dashboard/);
  });

  test('Invalid login -> shows error toast, stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="owner@example.com"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    const toast = page.locator('.go3958317564, .go2072408551, .go685806154, [role="status"]'); // generic toast locators for react-hot-toast
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

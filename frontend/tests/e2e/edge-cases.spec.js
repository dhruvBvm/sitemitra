import { test, expect } from '@playwright/test';

test.describe('11. Edge cases & error handling', () => {
  test('Protected route redirection', async ({ page }) => {
    // try to go to dashboard without login
    await page.goto('/owner/dashboard');
    // should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

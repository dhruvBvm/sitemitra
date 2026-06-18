# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> 1. Authentication >> Manager login -> redirects to /manager/dashboard
- Location: tests\e2e\auth.spec.js:12:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/manager\/dashboard/
Received string:  "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost:5173/login"

```

```yaml
- heading "Welcome Back" [level=2]
- paragraph: Sign in to access your ERP dashboard
- text: Email or Mobile
- textbox "owner@example.com": manager@example.com
- text: Password
- textbox "••••••••": anypassword
- button "Sign In"
- paragraph: "Demo accounts: owner@ / manager@ / staff@ (any password)"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('1. Authentication', () => {
  4  |   test('Owner login with valid credentials -> redirects to /owner/dashboard', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.fill('input[placeholder="owner@example.com"]', 'owner@example.com');
  7  |     await page.fill('input[type="password"]', 'anypassword');
  8  |     await page.click('button[type="submit"]');
  9  |     await expect(page).toHaveURL(/\/owner\/dashboard/);
  10 |   });
  11 | 
  12 |   test('Manager login -> redirects to /manager/dashboard', async ({ page }) => {
  13 |     await page.goto('/login');
  14 |     await page.fill('input[placeholder="owner@example.com"]', 'manager@example.com');
  15 |     await page.fill('input[type="password"]', 'anypassword');
  16 |     await page.click('button[type="submit"]');
> 17 |     await expect(page).toHaveURL(/\/manager\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  18 |   });
  19 | 
  20 |   test('Staff login -> redirects to /staff/dashboard', async ({ page }) => {
  21 |     await page.goto('/login');
  22 |     await page.fill('input[placeholder="owner@example.com"]', 'staff@example.com');
  23 |     await page.fill('input[type="password"]', 'anypassword');
  24 |     await page.click('button[type="submit"]');
  25 |     await expect(page).toHaveURL(/\/staff\/dashboard/);
  26 |   });
  27 | 
  28 |   test('Invalid login -> shows error toast, stays on login page', async ({ page }) => {
  29 |     await page.goto('/login');
  30 |     await page.fill('input[placeholder="owner@example.com"]', 'invalid@example.com');
  31 |     await page.fill('input[type="password"]', 'wrongpassword');
  32 |     await page.click('button[type="submit"]');
  33 |     await expect(page).toHaveURL(/\/login/);
  34 |     const toast = page.locator('.go3958317564, .go2072408551, .go685806154, [role="status"]'); // generic toast locators for react-hot-toast
  35 |     await expect(toast).toBeVisible({ timeout: 5000 });
  36 |   });
  37 | });
  38 | 
```
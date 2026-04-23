import { test, expect } from '@playwright/test';

test.describe('Routing bug check', () => {
  test('navigates to login without throwing buildHref is not a function', async ({ page }) => {
    // Our local dev server is running on 8081
    await page.goto('/');

    // Next, the auth module should redirect us to /welcome
    await expect(page).toHaveURL(/.*\/welcome/);

    // Instead of clicking "Đăng nhập", we simulate user interaction.
    // The button class should have text "Đăng nhập"
    await page.locator('text=Đăng nhập').click();

    // If the crash happens, the UI breaks and URL never changes.
    // We expect it to successfully reach /login
    await expect(page).toHaveURL(/.*\/login/);

    // Check that we actually see the Login screen title
    await expect(page.locator('text=Đăng nhập hệ thống phân tích')).toBeVisible();
  });

});

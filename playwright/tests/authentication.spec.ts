import { test, expect } from '@playwright/test';

test('login and logout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('role=heading[name=/logga in/i]')).toBeVisible();

  await page
    .locator('role=textbox[name=/e-post/i]')
    .type('micke_eri@hotmail.com');
  await page.locator('role=textbox[name=/lösenord/i]').type('password');

  await page.locator('role=button[name=/logga in/i]').click();

  await expect(page).toHaveURL(/dashboard/);

  await page.locator('role=button[name=/logga ut/i]').click();

  await expect(page).toHaveURL(/login/);
});

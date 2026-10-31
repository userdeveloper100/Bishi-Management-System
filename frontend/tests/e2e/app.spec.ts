import { expect, test } from '@playwright/test';

test('a signed-out visitor is sent to the phone sign-in screen', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome to BhishiPay' })).toBeVisible();
});

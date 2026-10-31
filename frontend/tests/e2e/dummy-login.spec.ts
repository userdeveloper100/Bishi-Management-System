import { expect, test } from '@playwright/test';

// Pre-configured local test account: +91 1234567890 signs in with OTP 560142.
// Requires the backend running with USE_LOCAL_OTP=true or NODE_ENV=development.
test('dummy number signs in with 560142 and reaches the groups screen', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome to BhishiPay' })).toBeVisible();

  await page.getByLabel('Mobile number').fill('1234567890');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page).toHaveURL(/\/otp$/);

  // Pasting the whole code into the first box fills all six boxes.
  await page.getByLabel('Digit 1 of 6').fill('560142');
  await page.getByRole('button', { name: 'Verify & continue' }).click();

  await expect(page).toHaveURL(/\/tabs\/groups$/);
  await expect(page.getByRole('heading', { name: 'Your Groups' })).toBeVisible();
});

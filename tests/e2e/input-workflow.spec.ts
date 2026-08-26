import { expect, test } from '@playwright/test';

test('opens the input workflow and resets an unsaved draft', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Add Patient' }).first().click();

  await expect(page.locator('header').getByText('New Patient')).toBeVisible();

  const editor = page.getByPlaceholder(/Patient is a 56-year-old male/);
  await editor.fill('A test note that is long enough to save as a draft.');
  await expect(editor).toHaveValue('A test note that is long enough to save as a draft.');

  await page.getByRole('button', { name: 'Reset Form' }).click();
  await expect(page.getByText('Clear current data?')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm Reset' }).click();

  await expect(editor).toHaveValue('');
});

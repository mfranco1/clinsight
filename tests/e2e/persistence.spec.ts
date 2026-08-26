import { expect, test } from '@playwright/test';
import { legacyPatientCase } from '../fixtures/patient-cases';

test('hydrates a legacy persisted patient case', async ({ page }) => {
  await page.addInitScript((serializedCase) => {
    window.localStorage.setItem('clinsight_patients', serializedCase);
  }, JSON.stringify([legacyPatientCase]));

  await page.goto('/');

  await expect(page.getByText('Test Patient')).toBeVisible();
  await expect(page.getByText('TEST-001')).toBeVisible();
});

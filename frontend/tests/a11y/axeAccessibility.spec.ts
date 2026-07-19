import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openDatabaseBackedFanApp } from '../support/databaseFixture';

test.describe('Accessibility (WCAG 2.2 AA)', () => {
  test('Fan Portal has no automatically detectable violations', async ({ page }) => {
    await openDatabaseBackedFanApp(page);
    await page.waitForSelector('svg.map-svg');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .exclude('.razorpay-checkout-frame')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Concierge view has no automatically detectable violations', async ({ page }) => {
    await openDatabaseBackedFanApp(page);
    await page.getByRole('button', { name: 'Concierge' }).click();
    await page.waitForSelector('.chat-container');

    const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { databaseMap, openDatabaseBackedFanApp } from '../support/databaseFixture';

test.describe('Navigation & Fan Portal E2E', () => {
  test.beforeEach(async ({ page }) => {
    await openDatabaseBackedFanApp(page);
  });

  test('loads and renders nodes supplied by the database map endpoint', async ({ page }) => {
    await expect(page.locator('svg.map-svg')).toBeVisible();
    await expect(page.locator('g.map-node')).toHaveCount(databaseMap.nodes.length);
    await expect(page.getByRole('banner').getByText('MetLife Stadium', { exact: true })).toBeVisible();
  });

  test('multilingual concierge chat uses the API response', async ({ page }) => {
    await page.route('**/api/chat', route => route.fulfill({ json: {
      reply: 'Mocked RAG response for navigation.', intent: 'navigation', language: 'en',
      route: { path: databaseMap.nodes, totalDistance: 20, totalTime: 20, accessible: false },
      sources: ['faq.txt'],
    } }));

    await page.getByRole('button', { name: 'Concierge' }).click();
    const chatInput = page.getByPlaceholder(/Ask Concierge/i);
    await chatInput.fill('Where is the nearest restroom?');
    await chatInput.press('Enter');

    await expect(page.getByText('Mocked RAG response for navigation.')).toBeVisible();
    await expect(page.getByText(/faq\.txt/)).toBeVisible();
  });

  test('toggles accessibility mode', async ({ page }) => {
    const a11yToggle = page.locator('#accessibility-check');
    await expect(a11yToggle).not.toBeChecked();
    await a11yToggle.check({ force: true });
    await expect(a11yToggle).toBeChecked();
  });
});

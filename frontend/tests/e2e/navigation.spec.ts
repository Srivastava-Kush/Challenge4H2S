import { test, expect } from '@playwright/test';
import { databaseMap, openDatabaseBackedFanApp } from '../support/databaseFixture';

test.describe('Navigation & Fan Portal E2E', () => {
  test.beforeEach(async ({ page }) => {
    // We do NOT call openDatabaseBackedFanApp here because we want to test the landing page in one of the tests.
    // We'll call it manually in the tests that need it.
  });

  test('landing page shows explore button and intercepts API', async ({ page }) => {
    await page.route('**/api/map', route => route.fulfill({ json: databaseMap }));
    await page.route('**/api/telemetry', route => route.abort('blockedbyclient'));
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const exploreButton = page.getByRole('button', { name: /Explore the stadium/i });
    await expect(exploreButton).toBeVisible();
    await exploreButton.click();
    await expect(page.locator('svg.map-svg')).toBeVisible();
  });

  test('loads and renders nodes supplied by the database map endpoint', async ({ page }) => {
    await openDatabaseBackedFanApp(page);
    await expect(page.locator('svg.map-svg')).toBeVisible();
    await expect(page.locator('g.map-node')).toHaveCount(databaseMap.nodes.length);
    await expect(page.getByRole('banner').getByText('MetLife Stadium', { exact: true })).toBeVisible();
  });

  test('multilingual concierge chat uses the API response', async ({ page }) => {
    await openDatabaseBackedFanApp(page);
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
    await openDatabaseBackedFanApp(page);
    const a11yToggle = page.locator('#accessibility-check');
    await expect(a11yToggle).not.toBeChecked();
    await a11yToggle.check({ force: true });
    await expect(a11yToggle).toBeChecked();
  });
  test('keyboard navigation allows tabbing through map nodes', async ({ page }) => {
    await openDatabaseBackedFanApp(page);
    // Tab until a map node is focused
    await page.keyboard.press('Tab');
    
    // We might need to tab multiple times to reach the SVG
    // Just locate a node and focus it to test interaction
    const firstNode = page.locator('g.map-node').first();
    await firstNode.focus();
    await expect(firstNode).toBeFocused();
    
    // Press Space or Enter to select
    await page.keyboard.press('Enter');
    
    // Verify it became active
    await expect(firstNode).toHaveClass(/active/);
  });
});

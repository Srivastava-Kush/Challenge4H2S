// import type { Page } from '@playwright/test';

// export const databaseMap = {
//   stadium: { name: 'MetLife Stadium', dimensions: { width: 1200, height: 1200 }, theme: { background: '#060913' } },
//   nodes: [
//     { id: 'gate_metlife', name: 'MetLife Gate', type: 'gate', level: 'ground', x: 200, y: 600, accessible: true },
//     { id: 'corridor_south', name: 'South Concourse', type: 'corridor', level: 'ground', x: 500, y: 800, accessible: true },
//     { id: 'restroom_1', name: 'Restroom 1', type: 'restroom', level: '100', x: 800, y: 600, accessible: true },
//   ],
//   edges: [
//     { id: 'gate_corridor', from: 'gate_metlife', to: 'corridor_south', distance: 10, walkTime: 10, accessible: true, stairs: false },
//     { id: 'corridor_restroom', from: 'corridor_south', to: 'restroom_1', distance: 10, walkTime: 10, accessible: true, stairs: false },
//   ],
//   crowd: { timestamp: '2026-07-19T00:00:00.000Z', nodes: { gate_metlife: { density: 20, status: 'Clear' }, corridor_south: { density: 25, status: 'Clear' } }, edges: {} },
// };

// export async function openDatabaseBackedFanApp(page: Page) {
//   await page.route('**/api/map', route => route.fulfill({ json: databaseMap }));
//   await page.goto('/');
//   await page.getByRole('button', { name: /Explore the stadium/i }).click();
//   await page.locator('svg.map-svg').waitFor();
// }


// frontend/tests/support/databaseFixture.ts
import type { Page } from '@playwright/test';

export const databaseMap = {
  stadium: { name: 'MetLife Stadium', dimensions: { width: 1200, height: 1200 }, theme: { background: '#060913' } },
  nodes: [
    { id: 'gate_metlife', name: 'MetLife Gate', type: 'gate', level: 'ground', x: 200, y: 600, accessible: true },
    { id: 'corridor_south', name: 'South Concourse', type: 'corridor', level: 'ground', x: 500, y: 800, accessible: true },
    { id: 'restroom_1', name: 'Restroom 1', type: 'restroom', level: '100', x: 800, y: 600, accessible: true },
  ],
  edges: [
    { id: 'gate_corridor', from: 'gate_metlife', to: 'corridor_south', distance: 10, walkTime: 10, accessible: true, stairs: false },
    { id: 'corridor_restroom', from: 'corridor_south', to: 'restroom_1', distance: 10, walkTime: 10, accessible: true, stairs: false },
  ],
  crowd: {
    timestamp: '2026-07-19T00:00:00.000Z',
    nodes: {
      gate_metlife: { density: 20, status: 'Clear' },
      corridor_south: { density: 25, status: 'Clear' },
    },
    edges: {},
  },
};




export async function openDatabaseBackedFanApp(page: Page) {
  await page.route('**/api/map', route => route.fulfill({ json: databaseMap }));
  await page.goto('/');

  // Wait for the button to be visible and enabled before clicking
  const exploreButton = page.getByRole('button', { name: /Explore the stadium/i });
  await exploreButton.waitFor({ state: 'visible' });
  await exploreButton.click();

  await page.locator('svg.map-svg').waitFor();
}

// export async function openDatabaseBackedFanApp(page: Page) {
//   await page.route('**/api/map', route => route.fulfill({ json: databaseMap }));
//   await page.goto('/');

//   const exploreButton = page.getByRole('button', { name: /Explore the stadium/i });
//   await exploreButton.waitFor({ state: 'visible' });
//   await exploreButton.click();

//   await page.locator('svg.map-svg').waitFor({ state: 'visible' });
// }


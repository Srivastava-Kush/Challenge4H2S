import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../services/stadiumDataService.js', () => ({ getNavigationData: vi.fn() }));
import { getNavigationData } from '../../services/stadiumDataService.js';
import { getRoute } from '../../tools/routingTool.js';

const nodes = [{ id: 'a', name: 'A', level: 'ground' }, { id: 'b', name: 'B', level: '100' }];
const edges = [{ from: 'a', to: 'b', distance: 10, walkTime: 60, accessible: true, stairs: false }];
describe('routingTool', () => {
  beforeEach(() => getNavigationData.mockResolvedValue({ nodes, edges, crowd: { nodes: {}, edges: {} } }));
  it('formats a route from current database data', async () => {
    const response = await getRoute({ fromNodeId: 'a', toNodeId: 'b' });
    expect(response.result.totalDistance).toBe(10);
    expect(response.formatted).toContain('Ground Floor');
  });
  it('uses supplied crowd data and reports adjusted routes', async () => {
    const response = await getRoute({ fromNodeId: 'a', toNodeId: 'b', accessibilityMode: true, crowd: { nodes: {}, edges: { a_b: { density: 90 } } } });
    expect(response.formatted).toContain('Route adjusted');
    expect(response.formatted).toContain('Step-free route');
  });
  it('returns a clear message when no database route exists', async () => {
    await expect(getRoute({ fromNodeId: 'a', toNodeId: 'missing' })).resolves.toEqual({ result: null, formatted: 'No route found between a and missing.' });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../models/GraphNode.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/GraphEdge.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../models/CrowdTelemetry.js', () => ({ default: { findOne: vi.fn() } }));
vi.mock('../../models/Stadium.js', () => ({ default: { findOne: vi.fn() } }));
import GraphNode from '../../models/GraphNode.js';
import GraphEdge from '../../models/GraphEdge.js';
import CrowdTelemetry from '../../models/CrowdTelemetry.js';
import Stadium from '../../models/Stadium.js';
import { getMapData, getNavigationData, normalizeCrowd, normalizeEdge, normalizeNode } from '../../services/stadiumDataService.js';

const lean = value => ({ lean: vi.fn().mockResolvedValue(value) });

describe('stadiumDataService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalizes legacy and document-shaped graph records', () => {
    expect(normalizeNode({ nodeId: 'n1', coordinates: { x: 4, y: 5 }, isAccessible: false }).id).toBe('n1');
    expect(normalizeNode({ toObject: () => ({ id: 'n2' }) })).toMatchObject({ x: 0, y: 0, accessible: true });
    expect(normalizeEdge({ edgeId: 'e1', source: 'a', target: 'b', distance: 12, isAccessible: false })).toMatchObject({ id: 'e1', from: 'a', to: 'b', walkTime: 10, accessible: false, stairs: false });
    expect(normalizeCrowd(null)).toMatchObject({ nodes: {}, edges: {} });
    expect(normalizeCrowd({ timestamp: '2026-01-01', nodes: { n: { density: 2 } } }).nodes.n.density).toBe(2);
  });

  it('loads and filters a normalized map from database models', async () => {
    GraphNode.find.mockReturnValue(lean([{ nodeId: 'n1', coordinates: { x: 1, y: 2 } }, { name: 'invalid' }]));
    GraphEdge.find.mockReturnValue(lean([{ edgeId: 'e1', source: 'n1', target: 'n2', distance: 6 }, { edgeId: 'bad', source: 'n1' }]));
    CrowdTelemetry.findOne.mockReturnValue({ sort: vi.fn().mockReturnValue(lean(null)) });
    Stadium.findOne.mockReturnValue(lean({ name: 'Stadium' }));
    const map = await getMapData();
    expect(map).toMatchObject({ stadium: { name: 'Stadium' }, nodes: [{ id: 'n1', x: 1, y: 2 }], edges: [{ id: 'e1', from: 'n1', to: 'n2' }] });
    await expect(getNavigationData()).resolves.toMatchObject({ nodes: map.nodes, edges: map.edges, crowd: { nodes: {}, edges: {} } });
  });
});

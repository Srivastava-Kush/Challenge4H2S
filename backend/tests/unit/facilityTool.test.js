import { getNearestFacility } from '../../tools/facilityTool.js';
import * as stadiumDataService from '../../services/stadiumDataService.js';

vi.mock('../../services/stadiumDataService.js', () => ({
  getNavigationData: vi.fn()
}));

describe('facilityTool', () => {
  const mockNodes = [
    { id: 'gate_1', name: 'Gate 1', type: 'gate', level: 'ground', x: 0, y: 0, accessible: true },
    { id: 'restroom_near', name: 'Restroom Near', type: 'restroom', level: 'ground', x: 10, y: 0, accessible: true },
    { id: 'restroom_far', name: 'Restroom Far', type: 'restroom', level: 'ground', x: 100, y: 0, accessible: true },
    { id: 'food_1', name: 'Burger Stand', type: 'food', level: 'ground', x: 5, y: 5, accessible: true }
  ];

  const mockEdges = [
    { from: 'gate_1', to: 'restroom_near', distance: 10, walkTime: 60, accessible: true, stairs: false },
    { from: 'gate_1', to: 'food_1', distance: 5, walkTime: 30, accessible: true, stairs: false },
    { from: 'restroom_near', to: 'restroom_far', distance: 90, walkTime: 500, accessible: true, stairs: false }
  ];

  beforeEach(() => {
    stadiumDataService.getNavigationData.mockResolvedValue({
      nodes: mockNodes,
      edges: mockEdges,
      crowd: { nodes: {}, edges: {} },
    });
  });

  it('finds the nearest facility of the requested type', async () => {
    const { facilityNode, result } = await getNearestFacility({ facilityType: 'restroom', fromNodeId: 'gate_1' });
    
    expect(facilityNode).toBeDefined();
    expect(facilityNode?.id).toBe('restroom_near');
    expect(result?.totalDistance).toBe(10);
  });

  it('returns null if the facility type does not exist', async () => {
    const { facilityNode, result, formatted } = await getNearestFacility({ facilityType: 'prayer', fromNodeId: 'gate_1' });
    
    expect(facilityNode).toBeNull();
    expect(result).toBeNull();
    expect(formatted).toContain('No prayer facilities found');
  });

  it('differentiates types correctly', async () => {
    const { facilityNode } = await getNearestFacility({ facilityType: 'food', fromNodeId: 'gate_1' });
    expect(facilityNode?.id).toBe('food_1');
  });

  it('reports when a facility exists but cannot be reached', async () => {
    stadiumDataService.getNavigationData.mockResolvedValue({
      nodes: mockNodes,
      edges: [],
      crowd: { nodes: {}, edges: {} },
    });
    const result = await getNearestFacility({ facilityType: 'restroom', fromNodeId: 'gate_1' });
    expect(result.result).toBeNull();
    expect(result.formatted).toContain('Could not find a walkable route');
  });
});

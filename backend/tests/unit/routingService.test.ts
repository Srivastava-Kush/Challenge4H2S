import { findRoute, getCrowdMultiplier } from '../../services/routingService.ts';

describe('routingService (Dijkstra algorithm)', () => {
  const mockNodes = [
    { id: 'gate_1', name: 'Gate 1', type: 'gate', level: 'ground', x: 0, y: 0, accessible: true },
    { id: 'hall_1', name: 'Hall 1', type: 'corridor', level: 'ground', x: 10, y: 0, accessible: true },
    { id: 'restroom_1', name: 'Restroom 1', type: 'restroom', level: 'ground', x: 20, y: 0, accessible: true },
    { id: 'level_2', name: 'Level 2', type: 'section', level: '100', x: 10, y: 10, accessible: true }
  ];

  const mockEdges = [
    // Standard path
    { from: 'gate_1', to: 'hall_1', distance: 10, walkTime: 60, accessible: true, stairs: false },
    { from: 'hall_1', to: 'restroom_1', distance: 10, walkTime: 60, accessible: true, stairs: false },
    // Stair path to Level 2
    { from: 'hall_1', to: 'level_2', distance: 5, walkTime: 30, accessible: true, stairs: true },
    // Lift path to Level 2
    { from: 'hall_1', to: 'level_2', distance: 20, walkTime: 120, accessible: true, stairs: false }
  ];

  const mockCrowdData = {
    timestamp: '2026-07-18T10:00:00Z',
    nodes: {},
    edges: {
      'gate_1_hall_1': { density: 30 }
    }
  };

  it('computes basic shortest path', () => {
    const route = findRoute('gate_1', 'restroom_1', mockNodes, mockEdges, mockCrowdData, false);
    expect(route).toBeDefined();
    expect(route?.path.length).toBe(3); // gate -> hall -> restroom
    expect(route?.totalDistance).toBe(20);
    expect(route?.routeAdjusted).toBe(false);
  });

  it('chooses stairs by default for shorter distance', () => {
    const route = findRoute('gate_1', 'level_2', mockNodes, mockEdges, mockCrowdData, false);
    expect(route?.path[2].id).toBe('level_2');
    expect(route?.totalDistance).toBe(15); // 10 (hall) + 5 (stairs)
  });

  it('filters out stairs when accessibilityMode is true', () => {
    const route = findRoute('gate_1', 'level_2', mockNodes, mockEdges, mockCrowdData, true);
    expect(route?.totalDistance).toBe(30); // 10 (hall) + 20 (lift) - forces the longer lift path
  });

  it('handles disconnected graphs returning null', () => {
    const brokenEdges = [{ from: 'gate_1', to: 'hall_1', distance: 10, walkTime: 60, accessible: true, stairs: false }];
    const route = findRoute('gate_1', 'restroom_1', mockNodes, brokenEdges, mockCrowdData, false);
    expect(route).toBeNull();
  });

  describe('getCrowdMultiplier', () => {
    it('returns 1x for density < 40', () => expect(getCrowdMultiplier(30)).toBe(1.0));
    it('returns 1.5x for density < 60', () => expect(getCrowdMultiplier(50)).toBe(1.5));
    it('returns 3.0x for density < 80', () => expect(getCrowdMultiplier(70)).toBe(3.0));
    it('returns 8.0x for density >= 80', () => expect(getCrowdMultiplier(90)).toBe(8.0));
  });

  it('reroutes to avoid heavy crowd density', () => {
    // Add a bypass route
    const alternativeEdges = [
      ...mockEdges,
      { from: 'gate_1', to: 'restroom_1', distance: 25, walkTime: 150, accessible: true, stairs: false } // Longer bypass
    ];
    
    // Make the direct 'gate_1 -> hall_1' edge highly congested (8.0x multiplier)
    const crowdedData = {
      ...mockCrowdData,
      edges: { 'gate_1_hall_1': { density: 85 } }
    };

    const route = findRoute('gate_1', 'restroom_1', mockNodes, alternativeEdges, crowdedData, false);
    expect(route?.routeAdjusted).toBe(true);
    expect(route?.edges.length).toBe(1); // Takes the direct bypass instead of the 2-step hall route
    expect(route?.totalDistance).toBe(25);
  });
});

import { expect, test, describe } from 'vitest';
import { findRoute, getCrowdMultiplier, getEdgeDensity } from './routing';
import type { Node, Edge, CrowdData } from './routing';

describe('Routing Utilities', () => {
  const nodes: Node[] = [
    { id: 'gate_a', name: 'Gate A', type: 'gate', level: 'ground', x: 0, y: 0, accessible: true },
    { id: 'concourse', name: 'Concourse', type: 'corridor', level: 'ground', x: 10, y: 0, accessible: true },
    { id: 'section_101', name: 'Section 101', type: 'section', level: '100', x: 20, y: 0, accessible: false },
    { id: 'lift', name: 'Lift', type: 'lift', level: 'ground', x: 10, y: 10, accessible: true },
    { id: 'section_102', name: 'Section 102', type: 'section', level: '100', x: 20, y: 10, accessible: true }
  ];

  const edges: Edge[] = [
    { id: 'e1', from: 'gate_a', to: 'concourse', distance: 10, walkTime: 10, accessible: true, stairs: false },
    { id: 'e2', from: 'concourse', to: 'section_101', distance: 10, walkTime: 20, accessible: false, stairs: true },
    { id: 'e3', from: 'concourse', to: 'lift', distance: 10, walkTime: 10, accessible: true, stairs: false },
    { id: 'e4', from: 'lift', to: 'section_102', distance: 10, walkTime: 10, accessible: true, stairs: false }
  ];

  const crowd: CrowdData = {
    timestamp: '2026-07-19T00:00:00Z',
    nodes: {},
    edges: {
      'gate_a_concourse': { density: 20, status: 'Low' },
      'concourse_lift': { density: 70, status: 'High' }
    }
  };

  test('getCrowdMultiplier returns correct values', () => {
    expect(getCrowdMultiplier(30)).toBe(1.0);
    expect(getCrowdMultiplier(50)).toBe(1.5);
    expect(getCrowdMultiplier(70)).toBe(3.0);
    expect(getCrowdMultiplier(90)).toBe(8.0);
  });

  test('getEdgeDensity works with proper direction mapping', () => {
    // Our crowd edges map doesn't use from_to syntax in the mock, but routing.ts checks e.id or from_to
    // Let's test the function directly assuming it matches edge ids or composite keys
    const mockCrowd = {
      timestamp: 'now',
      nodes: {},
      edges: {
        'gate_a_concourse': { density: 50, status: 'Medium' },
        'lift_section_102': { density: 10, status: 'Low' }
      }
    };
    
    expect(getEdgeDensity('gate_a', 'concourse', mockCrowd)).toBe(50);
    expect(getEdgeDensity('concourse', 'gate_a', mockCrowd)).toBe(50); // bidirectional check
    expect(getEdgeDensity('gate_a', 'lift', mockCrowd)).toBe(0); // missing
  });

  test('findRoute calculates shortest path without accessibility filter', () => {
    const result = findRoute('gate_a', 'section_101', nodes, edges, crowd, false);
    expect(result).not.toBeNull();
    expect(result?.path.map(n => n.id)).toEqual(['gate_a', 'concourse', 'section_101']);
    // walkTime = e1(10) * multiplier(20 density -> 1.0) + e2(20) * multiplier(0 density -> 1.0) = 30
    expect(result?.totalTime).toBe(30);
    expect(result?.totalDistance).toBe(20);
  });

  test('findRoute calculates accessible path (skips stairs)', () => {
    // If accessibilityMode = true, e2 (stairs) is skipped, so section_101 is unreachable
    const resultTo101 = findRoute('gate_a', 'section_101', nodes, edges, crowd, true);
    expect(resultTo101).toBeNull();

    // Route to section_102 via lift is accessible
    const resultTo102 = findRoute('gate_a', 'section_102', nodes, edges, crowd, true);
    expect(resultTo102).not.toBeNull();
    expect(resultTo102?.path.map(n => n.id)).toEqual(['gate_a', 'concourse', 'lift', 'section_102']);
  });

  test('findRoute adjusts weights based on crowd density', () => {
    // e1 has 20% density (1.0x), e3 has 70% density (3.0x), e4 has 0% (1.0x)
    // walkTime = e1(10)*1.0 + e3(10)*3.0 + e4(10)*1.0 = 50
    const result = findRoute('gate_a', 'section_102', nodes, edges, crowd, true);
    expect(result?.totalTime).toBe(50);
    // distance is unaffected by density
    expect(result?.totalDistance).toBe(30);
  });
});

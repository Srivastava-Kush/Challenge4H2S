import { getCrowdSummary } from '../../tools/crowdTool.js';
import * as stadiumDataService from '../../services/stadiumDataService.js';

vi.mock('../../services/stadiumDataService.js', () => ({
  getNavigationData: vi.fn()
}));

describe('crowdTool', () => {
  it('identifies congested areas and triggers warnings', async () => {
    stadiumDataService.getNavigationData.mockResolvedValue({
      nodes: [], edges: [], crowd: { nodes: {
        'gate_metlife': { density: 85 }, // Critical
        'gate_verizon': { density: 20 }, // Clear
        'corridor_south': { density: 65 } // Busy
      }, edges: {} }
    });

    const summary = await getCrowdSummary();
    
    expect(summary.hasWarning).toBe(true);
    expect(summary.leastCrowdedGate).toBe('Gate B — Verizon'); // Should pick the 20% gate
    expect(summary.summary).toContain('Gate B — Verizon has the shortest queue');
    expect(summary.gates.find((g) => g.id === 'gate_metlife')?.status).toBe('Critical');
  });

  it('reports all clear when density is low', async () => {
    stadiumDataService.getNavigationData.mockResolvedValue({
      nodes: [], edges: [], crowd: { nodes: {
        'gate_metlife': { density: 10 },
        'gate_verizon': { density: 15 }
      }, edges: {} }
    });

    const summary = await getCrowdSummary();
    
    expect(summary.hasWarning).toBe(false);
    expect(summary.summary).toContain('All areas are clear');
  });

  it('uses safe defaults when telemetry is missing', async () => {
    stadiumDataService.getNavigationData.mockResolvedValue({ nodes: [], edges: [], crowd: { nodes: {}, edges: {} } });
    const summary = await getCrowdSummary();
    expect(summary.gates).toHaveLength(4);
    expect(summary.gates[0].density).toBe(30);
  });
});

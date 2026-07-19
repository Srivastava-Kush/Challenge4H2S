import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../models/Stadium.js', () => ({ default: { findOne: vi.fn() } }));
vi.mock('../../services/stadiumDataService.js', () => ({ getMapData: vi.fn() }));

import Stadium from '../../models/Stadium.js';
import { getMapData } from '../../services/stadiumDataService.js';
import { getFacilities, getMap, getNodes, getStadium } from '../../controllers/dataController.js';

const databaseMap = {
  stadium: { name: 'MetLife Stadium' },
  nodes: [{ id: 'gate_db', name: 'Gate from database', type: 'gate', x: 10, y: 20, accessible: true }],
  edges: [{ id: 'edge_db', from: 'gate_db', to: 'restroom_db', distance: 12, walkTime: 10, accessible: true, stairs: false }],
  crowd: { timestamp: '2026-07-19T00:00:00.000Z', nodes: {}, edges: {} },
};

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('dataController database-backed endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the complete normalized map loaded from the database service', async () => {
    getMapData.mockResolvedValue(databaseMap);
    const res = response();

    await getMap({}, res);

    expect(getMapData).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith(databaseMap);
  });

  it('returns only database nodes without using frontend fixture data', async () => {
    getMapData.mockResolvedValue(databaseMap);
    const res = response();

    await getNodes({}, res);

    expect(res.json).toHaveBeenCalledWith(databaseMap.nodes);
  });

  it('returns the stadium and facilities persisted by the Stadium model', async () => {
    const stadium = { name: 'MetLife Stadium', facilities: [{ id: 'restroom_db', type: 'restroom' }] };
    Stadium.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(stadium) });

    const stadiumResponse = response();
    await getStadium({}, stadiumResponse);
    expect(stadiumResponse.json).toHaveBeenCalledWith(stadium);

    const facilitiesResponse = response();
    await getFacilities({}, facilitiesResponse);
    expect(facilitiesResponse.json).toHaveBeenCalledWith(stadium.facilities);
  });

  it('reports a server error when the database read fails', async () => {
    getMapData.mockRejectedValue(new Error('database unavailable'));
    const res = response();

    await getMap({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to load stadium map data' });
  });
});

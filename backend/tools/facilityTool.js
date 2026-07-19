/**
 * facilityTool.js
 *
 * Finds the nearest facility of a given type from a starting node,
 * then routes to it using the Dijkstra engine.
 *
 * Pure function — no HTTP, no side effects.
 */

import { findRoute } from '../services/routingService.ts';
import { getNavigationData } from '../services/stadiumDataService.js';

const FACILITY_LABELS = {
  restroom: '🚻 Restroom',
  food:     '🍔 Food Stand',
  medical:  '🏥 First Aid',
  prayer:   '🕌 Prayer Room',
  lift:     '🛗 Lift / Elevator',
  gate:     '🚪 Gate',
  section:  '🪑 Seat Section',
};

/**
 * Find the nearest facility of a given type and compute a route to it.
 *
 * @param {object} params
 * @param {string} params.facilityType — e.g. "restroom", "food", "medical"
 * @param {string} params.fromNodeId   — starting node id
 * @param {boolean} [params.accessibilityMode=false]
 * @returns {{ facilityNode: object|null, result: object|null, formatted: string }}
 */
export async function getNearestFacility({ facilityType, fromNodeId, accessibilityMode = false }) {
  const { nodes, edges, crowd } = await getNavigationData();

  const candidates = nodes.filter(n => n.type === facilityType);
  if (candidates.length === 0) {
    return {
      facilityNode: null,
      result: null,
      formatted: `No ${facilityType} facilities found in the stadium data.`,
    };
  }

  // Try each candidate and pick the one with the shortest route time
  let bestRoute   = null;
  let bestNode    = null;
  let bestTime    = Infinity;

  for (const candidate of candidates) {
    const route = findRoute(fromNodeId, candidate.id, nodes, edges, crowd, accessibilityMode);
    if (route && route.totalTime < bestTime) {
      bestTime  = route.totalTime;
      bestRoute = route;
      bestNode  = candidate;
    }
  }

  if (!bestRoute || !bestNode) {
    return {
      facilityNode: bestNode,
      result: null,
      formatted: `Could not find a walkable route to a ${facilityType} from ${fromNodeId}.`,
    };
  }

  const label    = FACILITY_LABELS[facilityType] || facilityType;
  const minutes  = (bestRoute.totalTime / 60).toFixed(1);
  const stepLines = bestRoute.path.map((node, i) => {
    if (i === 0) return `📍 Start at ${node.name}`;
    if (i === bestRoute.path.length - 1) return `🏁 Arrive at ${node.name}`;
    const edge = bestRoute.edges[i - 1];
    return `   → Walk ${edge?.distance ?? '?'}m to ${node.name}`;
  });

  const accessNote = accessibilityMode ? '\n♿ Step-free route activated.' : '';

  const formatted = [
    `Nearest ${label}: ${bestNode.name}`,
    `Distance: ${bestRoute.totalDistance}m  |  ETA: ~${minutes} min${accessNote}`,
    '',
    ...stepLines,
  ].join('\n');

  return { facilityNode: bestNode, result: bestRoute, formatted };
}

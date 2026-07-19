/**
 * routingTool.js
 *
 * Wraps the Dijkstra routing engine. Returns structured route data
 * and a human-readable formatted string for LLM consumption.
 *
 * Pure function — no HTTP, no side effects.
 */

import { findRoute } from '../services/routingService.ts';
import { getNavigationData } from '../services/stadiumDataService.js';

/**
 * Compute a route between two nodes.
 *
 * @param {object} params
 * @param {string} params.fromNodeId
 * @param {string} params.toNodeId
 * @param {boolean} [params.accessibilityMode=false]
 * @param {object|null} [params.crowd] - crowd.json payload; loaded fresh if null
 * @returns {{ result: import('../services/routingService.ts').RouteResult|null, formatted: string }}
 */
export async function getRoute({ fromNodeId, toNodeId, accessibilityMode = false, crowd = null }) {
  const { nodes, edges, crowd: databaseCrowd } = await getNavigationData();
  const crowdData = crowd || databaseCrowd;

  const result = findRoute(fromNodeId, toNodeId, nodes, edges, crowdData, accessibilityMode);

  if (!result) {
    return {
      result: null,
      formatted: `No route found between ${fromNodeId} and ${toNodeId}.`,
    };
  }

  const minutes    = (result.totalTime / 60).toFixed(1);
  const distanceM  = result.totalDistance;
  const stepLines  = result.path.map((node, i) => {
    if (i === 0)                    return `📍 Start at ${node.name} (${levelLabel(node.level)})`;
    if (i === result.path.length - 1) return `🏁 Arrive at ${node.name} (${levelLabel(node.level)})`;
    const edge = result.edges[i - 1];
    const stairNote = edge?.stairs ? ' via stairs' : '';
    return `   → Walk ${edge?.distance ?? '?'}m to ${node.name}${stairNote}`;
  });

  const warnings = [];
  if (result.routeAdjusted)  warnings.push('⚠️ Route adjusted to avoid crowded areas.');
  if (accessibilityMode)     warnings.push('♿ Step-free route — stairs excluded.');

  const formatted = [
    `Route: ${fromNodeId} → ${toNodeId}`,
    `Distance: ${distanceM}m  |  ETA: ~${minutes} min`,
    ...warnings,
    '',
    ...stepLines,
  ].join('\n');

  return { result, formatted };
}

function levelLabel(level) {
  if (level === 'ground') return 'Ground Floor';
  if (level === '100')    return 'Level 1 (100s)';
  if (level === '200')    return 'Level 2 (200s)';
  if (level === '300')    return 'Level 3 (300s)';
  return `Level ${level}`;
}

/**
 * crowdTool.js
 *
 * Reads crowd.json and produces a structured congestion summary
 * suitable for LLM consumption and direct API responses.
 *
 * Pure function — no HTTP, no side effects.
 */

import { getNavigationData } from '../services/stadiumDataService.js';

const GATE_META = [
  { id: 'gate_metlife',  name: 'Gate A — MetLife',  baseThroughput: 60 },
  { id: 'gate_verizon',  name: 'Gate B — Verizon',  baseThroughput: 58 },
  { id: 'gate_pepsi',    name: 'Gate C — Pepsi',     baseThroughput: 65 },
  { id: 'gate_budlight', name: 'Gate D — Bud Light', baseThroughput: 55 },
];

const CORRIDOR_META = [
  { id: 'corridor_south', name: 'South Concourse' },
  { id: 'corridor_east',  name: 'East Concourse'  },
  { id: 'corridor_west',  name: 'West Concourse'  },
  { id: 'corridor_north', name: 'North Concourse' },
];

function statusLabel(density) {
  if (density < 40) return 'Clear';
  if (density < 60) return 'Moderate';
  if (density < 80) return 'Busy';
  return 'Critical';
}

function statusEmoji(density) {
  if (density < 40) return '🟢';
  if (density < 60) return '🟡';
  if (density < 80) return '🟠';
  return '🔴';
}

/**
 * Returns a full congestion summary from the current crowd data.
 *
 * @returns {{
 *   hasWarning: boolean,
 *   gates: object[],
 *   corridors: object[],
 *   leastCrowdedGate: string,
 *   summary: string,
 *   formatted: string
 * }}
 */
export async function getCrowdSummary() {
  const { crowd } = await getNavigationData();

  const gates = GATE_META.map(g => {
    const density    = crowd.nodes?.[g.id]?.density ?? 30;
    const queueSize  = Math.floor(density * 2.8);
    const throughput = Math.max(1, Math.floor(g.baseThroughput * (1 - density / 250)));
    const waitMin    = parseFloat((queueSize / throughput).toFixed(1));
    return {
      id:          g.id,
      name:        g.name,
      density,
      queueSize,
      throughput: `${throughput}/min`,
      waitMin,
      status:      statusLabel(density),
      emoji:       statusEmoji(density),
    };
  });

  const corridors = CORRIDOR_META.map(c => {
    const density = crowd.nodes?.[c.id]?.density ?? 30;
    return { id: c.id, name: c.name, density, status: statusLabel(density), emoji: statusEmoji(density) };
  });

  const leastCrowded = gates.reduce((a, b) => a.density < b.density ? a : b);
  const hasWarning   = gates.some(g => g.density >= 60) || corridors.some(c => c.density >= 60);

  const gateLines      = gates.map(g => `  ${g.emoji} ${g.name}: ${g.status} (${g.density}% density, ~${g.waitMin} min wait)`);
  const corridorLines  = corridors.map(c => `  ${c.emoji} ${c.name}: ${c.status}`);

  const recommendation = hasWarning
    ? `Recommendation: Use ${leastCrowded.name} for fastest entry.`
    : 'All entry points are operating normally.';

  const formatted = [
    '=== Crowd Status ===',
    'Gates:',
    ...gateLines,
    '',
    'Concourses:',
    ...corridorLines,
    '',
    recommendation,
  ].join('\n');

  const summary = hasWarning
    ? `Some areas are congested. ${leastCrowded.name} has the shortest queue (~${leastCrowded.waitMin} min wait).`
    : 'All areas are clear. No significant congestion detected.';

  return {
    hasWarning,
    gates,
    corridors,
    leastCrowdedGate: leastCrowded.name,
    summary,
    formatted,
  };
}

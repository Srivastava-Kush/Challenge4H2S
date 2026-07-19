/**
 * intentService.js
 *
 * LLM-based intent classifier. Sends a lightweight prompt to Gemini and
 * returns a structured JSON object describing what the user wants and
 * which backend tools to invoke.
 *
 * Falls back to a deterministic regex classifier when the LLM is unavailable.
 */

import { classifyIntent as llmClassify } from './llmService.js';

export { classifyIntent } from './llmService.js';

/**
 * Convenience wrapper — classify and also resolve node IDs from natural
 * language descriptions like "gate a" or "metlife gate".
 *
 * @param {string} message
 * @returns {Promise<{
 *   intent: string,
 *   language: string,
 *   entities: { from: string|null, to: string|null, facilityType: string|null },
 *   toolCalls: string[]
 * }>}
 */
export async function classifyAndResolve(message) {
  const intent = await llmClassify(message);

  // Resolve any natural-language gate/section references the LLM may have
  // produced as plain text rather than node IDs
  if (intent.entities) {
    intent.entities.from = resolveNodeId(intent.entities.from);
    intent.entities.to   = resolveNodeId(intent.entities.to);
  }

  return intent;
}

// ─── Node alias resolver ──────────────────────────────────────────────────────
// Maps common natural-language names to canonical node IDs so the LLM does
// not have to know the exact id strings.

const NODE_ALIASES = {
  // Gates
  'gate a': 'gate_metlife',     'gate metlife': 'gate_metlife',
  'gate b': 'gate_verizon',     'gate verizon':  'gate_verizon',
  'gate c': 'gate_pepsi',       'gate pepsi':    'gate_pepsi',
  'gate d': 'gate_budlight',    'gate bud light':'gate_budlight',  'bud light gate': 'gate_budlight',
  // Corridors
  'south concourse': 'corridor_south', 'north concourse': 'corridor_north',
  'east concourse':  'corridor_east',  'west concourse':  'corridor_west',
  // Facilities
  'restroom': 'restroom_1',  'toilet': 'restroom_1', 'washroom': 'restroom_1',
  'food stand': 'food_1',    'food':   'food_1',
  'first aid': 'medical_1',  'medical': 'medical_1',
  'prayer room': 'prayer_1', 'prayer':  'prayer_1',
  'lift':        'lift_1',   'elevator':'lift_1',
  // Sections
  'section 124': 'section_124', '124': 'section_124',
  'section 140': 'section_140', '140': 'section_140',
  'section 208': 'section_208', '208': 'section_208',
  'section 313': 'section_313', '313': 'section_313',
};

function resolveNodeId(raw) {
  if (!raw) return null;
  // Already a valid node ID (contains underscore)
  if (raw.includes('_')) return raw;
  const lower = raw.toLowerCase().trim();
  return NODE_ALIASES[lower] || null;
}

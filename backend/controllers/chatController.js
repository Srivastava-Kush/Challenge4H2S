/**
 * chatController.js
 *
 * GenAI chatbot orchestration layer for StadiumIQ.
 *
 * Flow:
 *   1. Security validation (injection guard + rate limiter)
 *   2. Intent classification via Gemini (LLM)
 *   3. Tool execution: routing, facility lookup, crowd status
 *   4. Semantic RAG retrieval (MongoDB Atlas Vector Search → in-memory cosine → TF-IDF)
 *   5. Gemini response generation with full context
 *   6. Structured JSON response to frontend
 *
 * Data contract:
 *   Request:  { message, language?, accessibilityMode?, startNodeId?, sessionId? }
 *   Response: { reply, intent, route, crowd, sources, language }
 */

import { classifyAndResolve }   from '../services/intentService.js';
import { search as ragSearch }  from '../services/ragService.js';
import { generateResponse }     from '../services/llmService.js';
import { getRoute }             from '../tools/routingTool.js';
import { getNearestFacility }   from '../tools/facilityTool.js';
import { getCrowdSummary }      from '../tools/crowdTool.js';

// ─── Security ─────────────────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore previous/i, /ignore instructions/i, /system override/i,
  /dan mode/i,        /bypass system/i,        /you are now a/i,
  /forget your instructions/i, /disregard/i,   /jailbreak/i,
  /act as if/i,       /pretend you are/i,
];

const requestLogs = new Map();

function rateLimitCheck(ip) {
  const now  = Date.now();
  const logs = (requestLogs.get(ip) || []).filter(t => now - t < 10_000);
  logs.push(now);
  requestLogs.set(ip, logs);
  return logs.length <= 8; // 8 requests per 10 seconds
}

// ─── Default node resolution ──────────────────────────────────────────────────

const DEFAULT_START = 'gate_metlife';

// ─── Main Handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/chat
 */
export const chatWithAssistant = async (req, res) => {
  const clientIp = req.ip || 'unknown';

  if (!rateLimitCheck(clientIp)) {
    return res.status(429).json({
      reply: '⚠️ You are sending messages too quickly. Please wait a moment and try again.',
      error: 'rate_limit',
    });
  }

  const {
    message,
    language        = 'en',
    accessibilityMode = false,
    startNodeId     = DEFAULT_START,
    sessionId       = null,         // reserved for future MongoDB chat history
  } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ reply: 'Please send a message.', error: 'empty_message' });
  }

  if (INJECTION_PATTERNS.some(p => p.test(message))) {
    return res.status(400).json({
      reply: '⚠️ That type of message is not allowed. Please ask about stadium navigation, facilities, or policies.',
      error: 'security_violation',
    });
  }

  // ── 1. Intent Classification ────────────────────────────────────────────────
  let intentObj;
  try {
    intentObj = await classifyAndResolve(message);
  } catch (err) {
    console.error('[Chat] Intent classification error:', err.message);
    intentObj = { intent: 'faq', language, entities: { from: null, to: null, facilityType: null }, toolCalls: ['rag'] };
  }

  const { intent, entities = {}, toolCalls = ['rag'] } = intentObj;
  const detectedLanguage = intentObj.language || language;

  // Prefer body-provided startNodeId over LLM-extracted 'from' if present
  const fromNode      = entities.from || startNodeId;
  const toNode        = entities.to;
  const facilityType  = entities.facilityType;
  const useAccessible = accessibilityMode || (intent === 'accessibility');

  // ── 2. Tool Execution ───────────────────────────────────────────────────────
  let routeResult    = null;
  let routeFormatted = null;
  let crowdData      = null;
  let crowdFormatted = null;
  let facilityResult = null;
  let facilityFormatted = null;

  // Routing tool
  if (toolCalls.includes('routing') && fromNode && toNode) {
    const r = await getRoute({ fromNodeId: fromNode, toNodeId: toNode, accessibilityMode: useAccessible });
    routeResult    = r.result;
    routeFormatted = r.formatted;
  }

  // Facility lookup tool
  if (toolCalls.includes('facility') && facilityType && fromNode) {
    const f = await getNearestFacility({ facilityType, fromNodeId: fromNode, accessibilityMode: useAccessible });
    facilityResult   = f.result;
    facilityFormatted = f.formatted;
    // If we got a route from facility lookup and no explicit routing was done, surface it
    if (!routeResult && f.result) {
      routeResult = f.result;
    }
  }

  // Crowd tool
  if (toolCalls.includes('crowd')) {
    const c    = await getCrowdSummary();
    crowdData  = { hasWarning: c.hasWarning, summary: c.summary, gates: c.gates, corridors: c.corridors };
    crowdFormatted = c.formatted;
  }

  // ── 3. RAG Retrieval ────────────────────────────────────────────────────────
  let ragChunks  = [];
  let ragSources = [];

  if (toolCalls.includes('rag')) {
    try {
      const ragResult = await ragSearch(message, 3);
      ragChunks  = ragResult.chunks;
      ragSources = ragResult.sources;
    } catch (err) {
      console.warn('[Chat] RAG search error:', err.message);
    }
  }

  // ── 4. LLM Response Generation ──────────────────────────────────────────────
  let reply;
  try {
    reply = await generateResponse({
      message,
      ragChunks,
      ragSources,
      routingOutput:  routeFormatted,
      crowdOutput:    crowdFormatted,
      facilityOutput: facilityFormatted,
      language: detectedLanguage,
    });
  } catch (err) {
    console.error('[Chat] LLM generation error:', err.message);
    // Graceful fallback chain
    if (routeFormatted)    reply = routeFormatted;
    else if (facilityFormatted) reply = facilityFormatted;
    else if (crowdFormatted)    reply = crowdFormatted;
    else if (ragChunks.length > 0) reply = `Based on the official guide:\n${ragChunks[0]}`;
    else reply = "I'm sorry, I couldn't process your request right now. Please try again.";
  }

  // ── 5. Response ─────────────────────────────────────────────────────────────
  return res.json({
    reply,
    intent,
    language: detectedLanguage,
    route: routeResult
      ? {
          path:          routeResult.path,
          edges:         routeResult.edges,
          totalDistance: routeResult.totalDistance,
          totalTime:     routeResult.totalTime,
          routeAdjusted: routeResult.routeAdjusted,
          accessible:    useAccessible,
        }
      : null,
    crowd: crowdData,
    sources: [...new Set(ragSources)],   // deduplicate
    sessionId,
  });
};

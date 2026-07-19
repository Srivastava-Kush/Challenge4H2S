/**
 * chatRoutes.js
 *
 * Dedicated router for chatbot and tool endpoints.
 * Mounted at /api/chat in routes/index.js.
 *
 * Endpoints:
 *   POST /api/chat              — main orchestrated chat
 *   GET  /api/chat/tools/route  — direct routing tool (for testing / map)
 *   GET  /api/chat/tools/crowd  — direct crowd summary tool
 *   GET  /api/chat/tools/facility — direct facility lookup tool
 */

import express from 'express';
import { chatWithAssistant } from '../controllers/chatController.js';
import { getRoute }          from '../tools/routingTool.js';
import { getNearestFacility } from '../tools/facilityTool.js';
import { getCrowdSummary }   from '../tools/crowdTool.js';

const router = express.Router();

// ── Main Chat Endpoint ────────────────────────────────────────────────────────

router.post('/', chatWithAssistant);

// ── Direct Tool Endpoints (useful for frontend map + debugging) ───────────────

/**
 * GET /api/chat/tools/route
 * Query: from, to, accessible (boolean string)
 */
router.get('/tools/route', async (req, res, next) => {
  const { from, to, accessible = 'false' } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Query params "from" and "to" are required.' });
  }

  try {
    const { result, formatted } = await getRoute({
      fromNodeId:       from,
      toNodeId:         to,
      accessibilityMode: accessible === 'true',
    });
    res.json({ route: result, formatted });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chat/tools/crowd
 */
router.get('/tools/crowd', async (req, res, next) => {
  try {
    res.json(await getCrowdSummary());
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chat/tools/facility
 * Query: type (facility type), from (starting node id), accessible
 */
router.get('/tools/facility', async (req, res, next) => {
  const { type, from, accessible = 'false' } = req.query;

  if (!type || !from) {
    return res.status(400).json({ error: 'Query params "type" and "from" are required.' });
  }

  try {
    const { facilityNode, result, formatted } = await getNearestFacility({
      facilityType:     type,
      fromNodeId:       from,
      accessibilityMode: accessible === 'true',
    });
    res.json({ facility: facilityNode, route: result, formatted });
  } catch (err) {
    next(err);
  }
});

export default router;

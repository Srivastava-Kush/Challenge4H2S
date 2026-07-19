import express from 'express';
import authRoutes   from './authRoutes.js';
import matchRoutes  from './matchRoutes.js';
import orderRoutes  from './orderRoutes.js';
import chatRoutes   from './chatRoutes.js';
import { requireAuth } from '../routes/authRoutes.js';
import { getStadium, getNodes, getEdges, getCrowd, getFacilities, getMap } from '../controllers/dataController.js';
import { subscribeTelemetry } from '../controllers/telemetryController.js';
import { reportIncident, getMyIncidents, updateIncident, mitigateAlert, copilotQuery, getVolunteers } from '../controllers/incidentController.js';

const router = express.Router();

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden for this role' });
  next();
};

// ── Feature Routers ─────────────────────────────────────────────────────────
router.use('/auth',    authRoutes);
router.use('/matches', matchRoutes);
router.use('/chat',    chatRoutes);

// Order / payment routes (menu, orders, payment)
router.use('/payment', orderRoutes);
router.use('/',        orderRoutes);

// ── Static Data Endpoints (now served from DB) ───────────────────────────────
router.get('/stadium',    getStadium);
router.get('/map',        getMap);
router.get('/nodes',      getNodes);
router.get('/edges',      getEdges);
router.get('/crowd',      getCrowd);
router.get('/facilities', getFacilities);

// ── Operations Endpoints ─────────────────────────────────────────────────────
router.get('/telemetry',   subscribeTelemetry);
router.post('/incidents',  requireAuth, requireRole('volunteer', 'ops'), reportIncident);
router.get('/incidents/mine', requireAuth, requireRole('volunteer'), getMyIncidents);
router.patch('/incidents/:id', requireAuth, requireRole('ops'), updateIncident);
router.post('/mitigate',   requireAuth, requireRole('ops'), mitigateAlert);
router.post('/copilot',    requireAuth, requireRole('ops'), copilotQuery);

// ── Volunteer Endpoints ──────────────────────────────────────────────────────
router.get('/volunteers',  requireAuth, getVolunteers);

export default router;

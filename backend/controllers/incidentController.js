import { broadcastToSSE } from '../services/sseService.js';
import Incident from '../models/Incident.js';
import Alert from '../models/Alert.js';
import { User } from '../models/User.js';
import { calculateQueues } from './telemetryController.js';

const INCIDENT_STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'];

const serializeIncident = incident => {
  const source = incident.toObject?.() ?? incident;
  return {
    ...source,
    id: source.incidentId ?? String(source._id),
    reporterId: source.reporter?._id ? String(source.reporter._id) : String(source.reporter ?? ''),
    reporterName: source.reporter?.name ?? source.reporterName ?? 'Unknown reporter',
  };
};

const serializeAlert = alert => {
  const source = alert.toObject?.() ?? alert;
  return { ...source, id: source.alertId ?? String(source._id) };
};

function classifyIncident(description) {
  const text = description.toLowerCase();
  if (/(spill|water|garbage|waste)/.test(text)) return { category: 'Cleaning', priority: 'Low' };
  if (/(hurt|medical|bleeding|collapse|unwell)/.test(text)) return { category: 'Medical', priority: 'High' };
  if (/(fight|security|weapon|threat)/.test(text)) return { category: 'Security', priority: 'High' };
  if (/(light|broken|damage|blocked)/.test(text)) return { category: 'Facilities', priority: 'Medium' };
  return { category: 'General', priority: 'Low' };
}

async function broadcastIncidents() {
  const incidents = await Incident.find().sort({ timestamp: -1 }).populate('reporter', 'name email').lean();
  broadcastToSSE({ type: 'INCIDENTS_UPDATED', incidents: incidents.map(serializeIncident) });
}

export const reportIncident = async (req, res) => {
  const { description, location } = req.body;
  if (!description?.trim() || !location) return res.status(400).json({ error: 'Description and location are required' });

  try {
    const { category, priority } = classifyIncident(description);
    const incident = await Incident.create({
      incidentId: `incident-${Date.now()}`,
      category,
      priority,
      description: description.trim(),
      location,
      reporter: req.user.id,
      reporterName: req.user.name,
      assignedTo: 'Operations triage',
    });
    const populated = await incident.populate('reporter', 'name email');
    await broadcastIncidents();
    res.status(201).json({ message: 'Incident submitted to operations triage.', incident: serializeIncident(populated) });
  } catch (err) {
    console.error('reportIncident error:', err);
    res.status(500).json({ error: 'Failed to submit incident' });
  }
};

export const getMyIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ reporter: req.user.id }).sort({ timestamp: -1 }).lean();
    res.json(incidents.map(serializeIncident));
  } catch (err) {
    console.error('getMyIncidents error:', err);
    res.status(500).json({ error: 'Failed to load your incidents' });
  }
};

export const updateIncident = async (req, res) => {
  const { status, assignedTo, resolutionNote } = req.body;
  if (status && !INCIDENT_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid incident status' });
  if (!status && assignedTo === undefined && resolutionNote === undefined) return res.status(400).json({ error: 'No incident changes provided' });

  try {
    const patch = { updatedAt: new Date() };
    if (status) patch.status = status;
    if (assignedTo !== undefined) patch.assignedTo = assignedTo;
    if (resolutionNote !== undefined) patch.resolutionNote = resolutionNote;
    if (status === 'Acknowledged') patch.acknowledgedAt = new Date();
    if (status === 'Resolved') patch.resolvedAt = new Date();

    const incident = await Incident.findOneAndUpdate({ incidentId: req.params.id }, { $set: patch }, { new: true }).populate('reporter', 'name email');
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    await broadcastIncidents();
    res.json({ incident: serializeIncident(incident) });
  } catch (err) {
    console.error('updateIncident error:', err);
    res.status(500).json({ error: 'Failed to update incident' });
  }
};

// Resolving an alert means the operations team has acted on the system warning.
export const mitigateAlert = async (req, res) => {
  const { alertId, resolutionNote = 'Mitigation protocol deployed.' } = req.body;
  if (!alertId) return res.status(400).json({ error: 'Missing alertId' });

  try {
    const now = new Date();
    const alert = await Alert.findOneAndUpdate(
      { alertId },
      { $set: { acknowledged: true, status: 'Resolved', acknowledgedBy: req.user.name, acknowledgedAt: now, resolvedBy: req.user.name, resolvedAt: now, resolutionNote, updatedAt: now } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    const alerts = await Alert.find().lean();
    broadcastToSSE({ type: 'ALERTS_UPDATED', alerts: alerts.map(serializeAlert) });
    res.json({ message: 'Alert resolved and mitigation recorded.', alert: serializeAlert(alert) });
  } catch (err) {
    console.error('mitigateAlert error:', err);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
};

export const copilotQuery = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });
  try {
    const lower = query.toLowerCase();
    if (lower.includes('gate') || lower.includes('capacity')) {
      const busy = calculateQueues().filter(queue => queue.status !== 'OK');
      return res.json({ answer: busy.length ? `${busy.map(queue => queue.name).join(', ')} require monitoring.` : 'All gate queues are operating normally.', actionRequired: null });
    }
    const active = await Incident.countDocuments({ status: { $ne: 'Resolved' } });
    return res.json({ answer: `There are ${active} unresolved incident reports in operations triage.`, actionRequired: null });
  } catch (err) {
    console.error('copilotQuery error:', err);
    res.status(500).json({ error: 'Copilot query failed' });
  }
};

export const getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' }).select('name email status location role').lean();
    res.json(volunteers);
  } catch (err) {
    console.error('getVolunteers error:', err);
    res.status(500).json({ error: 'Failed to load volunteers' });
  }
};

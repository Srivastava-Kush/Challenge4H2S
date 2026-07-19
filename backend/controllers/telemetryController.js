import { addClient, broadcastToSSE } from '../services/sseService.js';
import CrowdTelemetry from '../models/CrowdTelemetry.js';
import Incident from '../models/Incident.js';
import Alert from '../models/Alert.js';
import { normalizeCrowd } from '../services/stadiumDataService.js';

let currentCrowd = null; // In-memory cache for fast simulation ticks
let simulationTime = new Date('2026-07-17T18:30:00Z');
let simulationTicks = 0;

const serializeIncident = incident => ({ ...incident, id: incident.incidentId ?? String(incident._id) });
const serializeAlert = alert => ({ ...alert, id: alert.alertId ?? String(alert._id) });

// Load initial crowd state from DB into memory cache
async function loadCrowdFromDB() {
  try {
    const doc = await CrowdTelemetry.findOne().lean();
    if (doc) {
      currentCrowd = normalizeCrowd(doc);
      console.log('✅ Crowd telemetry loaded from MongoDB');
    }
  } catch (err) {
    console.error('Failed to load crowd from DB:', err.message);
  }
}

// Save updated crowd state back to DB
async function saveCrowdToDB() {
  try {
    await CrowdTelemetry.findOneAndUpdate(
      {},
      { $set: { nodes: currentCrowd.nodes, edges: currentCrowd.edges, timestamp: simulationTime } },
      { upsert: true }
    );
  } catch (err) {
    console.error('Failed to save crowd to DB:', err.message);
  }
}

export function calculateQueues() {
  if (!currentCrowd?.nodes) return [];
  const gates = [
    { id: 'gate_metlife',  name: 'Gate A (MetLife)',  baseThroughput: 60 },
    { id: 'gate_verizon',  name: 'Gate B (Verizon)',  baseThroughput: 58 },
    { id: 'gate_pepsi',    name: 'Gate C (Pepsi)',    baseThroughput: 65 },
    { id: 'gate_budlight', name: 'Gate D (Bud Light)', baseThroughput: 55 },
  ];
  return gates.map(g => {
    const density = currentCrowd.nodes[g.id]?.density || 30;
    const queueSize = Math.floor(density * 2.8);
    const throughput = Math.floor(g.baseThroughput * (1 - (density / 250)));
    const waitTime = parseFloat((queueSize / (throughput || 1)).toFixed(1));
    const status = density >= 80 ? 'CRITICAL' : density >= 60 ? 'WARNING' : 'OK';
    return { gateId: g.id, name: g.name, queue: queueSize, throughput: `${throughput}/min`, predictedWait: `${waitTime} min`, status };
  });
}

// Simulation tick — runs every 4 seconds
let tickInterval = null;
async function startSimulation() {
  await loadCrowdFromDB();

  tickInterval = setInterval(async () => {
    simulationTicks++;
    simulationTime.setSeconds(simulationTime.getSeconds() + 30);

    if (!currentCrowd?.nodes) return;

    try {
      // Check alert state from DB for crowd simulation logic
      const verizonAlert = await Alert.findOne({ alertId: 'alert-1' }).lean();

      if (verizonAlert && !verizonAlert.acknowledged) {
        const verizonCrowd = currentCrowd.nodes['gate_verizon'];
        if (verizonCrowd && verizonCrowd.density < 85) verizonCrowd.density += 1;
        if (verizonCrowd) verizonCrowd.status = 'high';
        if (currentCrowd.edges?.['gate_verizon_corridor_east']) {
          currentCrowd.edges['gate_verizon_corridor_east'].density = currentCrowd.nodes['gate_verizon'].density + 5;
        }
      } else if (verizonAlert?.acknowledged) {
        const verizonCrowd = currentCrowd.nodes['gate_verizon'];
        if (verizonCrowd?.density > 45) verizonCrowd.density -= 2;
        if (verizonCrowd?.density <= 50) verizonCrowd.status = 'medium';
        if (currentCrowd.nodes['gate_pepsi']?.density < 55) currentCrowd.nodes['gate_pepsi'].density += 1;
        if (currentCrowd.edges?.['gate_verizon_corridor_east']) {
          currentCrowd.edges['gate_verizon_corridor_east'].density = currentCrowd.nodes['gate_verizon'].density;
        }
      }

      // Every 5 ticks, persist crowd state to DB
      if (simulationTicks % 5 === 0) {
        await saveCrowdToDB();
      }

      // Fetch live incidents and alerts from DB for SSE broadcast
      const [incidents, alerts] = await Promise.all([
        Incident.find().sort({ timestamp: -1 }).lean(),
        Alert.find().lean(),
      ]);

      broadcastToSSE({
        type: 'TELEMETRY_TICK',
        timestamp: simulationTime.toISOString(),
        crowd: currentCrowd,
        incidents: incidents.map(serializeIncident),
        alerts: alerts.map(serializeAlert),
        queues: calculateQueues(),
        seed: 2026,
      });
    } catch (err) {
      console.error('Simulation tick error:', err.message);
    }
  }, 4000);
}

// SSE subscription handler
export const subscribeTelemetry = async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Telemetry Active' })}\n\n`);
  addClient(res);

  try {
    // Send current snapshot from DB immediately on connect
    const [incidents, alerts] = await Promise.all([
      Incident.find().sort({ timestamp: -1 }).lean(),
      Alert.find().lean(),
    ]);
    res.write(`data: ${JSON.stringify({
      type: 'TELEMETRY_TICK',
      timestamp: simulationTime.toISOString(),
      crowd: currentCrowd,
      incidents: incidents.map(serializeIncident),
      alerts: alerts.map(serializeAlert),
      queues: calculateQueues(),
      seed: 2026,
    })}\n\n`);
  } catch (err) {
    console.error('subscribeTelemetry initial send error:', err.message);
  }
};

// Start the simulation on module load (after a short delay for DB connection)
setTimeout(startSimulation, 2000);

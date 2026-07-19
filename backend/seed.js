import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

import { User } from './models/User.js';
import Match from './models/Match.js';
import Incident from './models/Incident.js';
import Alert from './models/Alert.js';
import MenuItem from './models/MenuItem.js';
import GraphNode from './models/GraphNode.js';
import GraphEdge from './models/GraphEdge.js';
import CrowdTelemetry from './models/CrowdTelemetry.js';
import Stadium from './models/Stadium.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');

function readJsonFile(filename) {
  try {
    const data = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err.message);
    return null;
  }
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({ role: 'volunteer' }),
      Match.deleteMany({}),
      Incident.deleteMany({}),
      Alert.deleteMany({}),
      MenuItem.deleteMany({}),
      GraphNode.deleteMany({}),
      GraphEdge.deleteMany({}),
      CrowdTelemetry.deleteMany({}),
      Stadium.deleteMany({})
    ]);
    console.log('Cleared existing data (kept fan/ops users).');

    // 1. Seed Volunteers into Users
    const volunteers = readJsonFile('volunteers.json');
    if (volunteers) {
      const volDocs = volunteers.map(v => ({
        name: v.name,
        email: `${v.id}@stadium.com`,
        password: 'password123', // Will be hashed by pre-save or we can hash manually
        role: 'volunteer',
        status: v.status || 'offline',
        location: v.location
      }));
      // Need to hash passwords manually for insertMany, or use create
      for (const vol of volDocs) {
        await User.create(vol);
      }
      console.log(`Seeded ${volunteers.length} volunteers.`);
    }

    // Provisioned demo account for the locked Operations portal.
    await User.findOneAndUpdate(
      { email: 'ops@stadiumiq.demo' },
      { $set: { name: 'Stadium Operations', password: await bcrypt.hash('ops12345', 12), role: 'ops', status: 'offline', authProvider: 'mongo' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Seeded operations demo account.');

    // 2. Matches
    const matches = readJsonFile('matches.json');
    if (matches) {
      const matchDocs = matches.map(m => ({ ...m, matchId: m.id }));
      await Match.insertMany(matchDocs);
      console.log(`Seeded ${matches.length} matches.`);
    }

    // 3. Incidents
    const incidents = readJsonFile('incidents.json');
    if (incidents) {
      const seedReporter = await User.findOne({ role: 'volunteer' });
      const incDocs = incidents.map(i => ({
        ...i,
        incidentId: i.id,
        reporter: seedReporter?._id,
        reporterName: seedReporter?.name || 'Seeded venue team',
        status: i.status === 'Active' ? 'Submitted' : (i.status || 'Submitted'),
      }));
      await Incident.insertMany(incDocs);
      console.log(`Seeded ${incidents.length} incidents.`);
    }

    // 4. Alerts
    const alerts = readJsonFile('alerts.json');
    if (alerts) {
      const alertDocs = alerts.map(a => ({ ...a, alertId: a.id }));
      await Alert.insertMany(alertDocs);
      console.log(`Seeded ${alerts.length} alerts.`);
    }

    // 5. Menu Items
    const menu = readJsonFile('menu.json');
    if (menu) {
      const menuDocs = menu.map(m => ({ ...m, itemId: m.id }));
      await MenuItem.insertMany(menuDocs);
      console.log(`Seeded ${menu.length} menu items.`);
    }

    // 6. Nodes & Edges
    const nodes = readJsonFile('nodes.json');
    if (nodes) {
      const nodeDocs = nodes.map(n => ({ ...n, nodeId: n.id }));
      await GraphNode.insertMany(nodeDocs);
      console.log(`Seeded ${nodes.length} nodes.`);
    }

    const edges = readJsonFile('edges.json');
    if (edges) {
      const edgeDocs = edges.map(e => ({ ...e, edgeId: e.id || `${e.from}-${e.to}` }));
      await GraphEdge.insertMany(edgeDocs);
      console.log(`Seeded ${edges.length} edges.`);
    }

    // 7. Crowd Telemetry
    const crowd = readJsonFile('crowd.json');
    if (crowd) {
      await CrowdTelemetry.create(crowd);
      console.log(`Seeded crowd telemetry.`);
    }

    // 8. Stadium Details (combining stadium.json, facilities.json, sections.json)
    const stadium = readJsonFile('stadium.json');
    const facilities = readJsonFile('facilities.json');
    const sections = readJsonFile('sections.json');
    if (stadium) {
      const stadiumDoc = {
        ...stadium,
        stadiumId: stadium.id,
        facilities: facilities || [],
        sections: sections || []
      };
      await Stadium.create(stadiumDoc);
      console.log(`Seeded stadium data.`);
    }

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();

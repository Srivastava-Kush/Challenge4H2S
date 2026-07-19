import mongoose from 'mongoose';

const crowdTelemetrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  nodes: { type: Map, of: new mongoose.Schema({
    density: Number,
    status: String
  }, { _id: false }) },
  edges: { type: Map, of: new mongoose.Schema({
    density: Number
  }, { _id: false }) }
});

export default mongoose.model('CrowdTelemetry', crowdTelemetrySchema);

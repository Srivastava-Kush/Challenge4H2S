import mongoose from 'mongoose';

const graphEdgeSchema = new mongoose.Schema({
  edgeId: { type: String, required: true, unique: true },
  // Canonical graph fields used by the routing engine.
  from: String,
  to: String,
  source: String,
  target: String,
  distance: Number,
  walkTime: Number,
  accessible: { type: Boolean, default: true },
  stairs: { type: Boolean, default: false },
  // Retained for compatibility with documents created by the earlier schema.
  type: String,
  isAccessible: Boolean
});

export default mongoose.model('GraphEdge', graphEdgeSchema);

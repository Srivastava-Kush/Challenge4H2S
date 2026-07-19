import mongoose from 'mongoose';

const graphNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  name: String,
  type: String,
  level: String,
  // Canonical map coordinates used by the frontend and routing UI.
  x: Number,
  y: Number,
  accessible: { type: Boolean, default: true },
  // Retained for compatibility with documents created by the earlier schema.
  coordinates: {
    x: Number,
    y: Number
  },
  connectedTo: [String],
  accessibility: [String]
});

export default mongoose.model('GraphNode', graphNodeSchema);

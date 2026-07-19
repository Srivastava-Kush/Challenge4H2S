import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  title: String,
  description: String,
  mitigation: String,
  type: String,
  // Alerts are system-detected operational warnings, not fan/volunteer reports.
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'Acknowledged', 'Resolved'], default: 'Open' },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedBy: String,
  resolvedAt: Date,
  resolutionNote: String,
  timestamp: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Alert', alertSchema);

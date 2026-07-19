import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  category: String,
  description: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High'] },
  location: String,
  // A report is a work item submitted by a person and tracked through resolution.
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: String,
  assignedTo: { type: String, default: 'Operations triage' },
  status: { type: String, enum: ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'], default: 'Submitted' },
  resolutionNote: String,
  acknowledgedAt: Date,
  resolvedAt: Date,
  timestamp: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Incident', incidentSchema);

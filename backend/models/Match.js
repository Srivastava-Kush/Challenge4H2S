import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  minute: Number,
  type: String,
  team: String,
  player: String,
  description: String
});

const matchSchema = new mongoose.Schema({
  matchId: { type: String, required: true, unique: true },
  homeTeam: String,
  awayTeam: String,
  homeFlag: String,
  awayFlag: String,
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'live', 'halftime', 'completed'], default: 'upcoming' },
  minute: Number,
  kickoffUtc: Date,
  venue: String,
  group: String,
  round: String,
  events: [eventSchema]
});

export default mongoose.model('Match', matchSchema);

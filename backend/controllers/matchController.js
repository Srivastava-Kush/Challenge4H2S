import Match from '../models/Match.js';
import { broadcastToSSE } from '../services/sseService.js';

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().lean();
    // Map matchId back to id for frontend compatibility
    res.json(matches.map(m => ({ ...m, id: m.matchId })));
  } catch (err) {
    console.error('getMatches error:', err);
    res.status(500).json({ error: 'Failed to load matches' });
  }
};

export const updateScore = async (req, res) => {
  if (req.user.role !== 'ops') {
    return res.status(403).json({ error: 'Forbidden — only ops team can update scores' });
  }

  const { id } = req.params;
  const { homeScore, awayScore, status, minute } = req.body;

  const allowedStatuses = ['upcoming', 'live', 'halftime', 'completed'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const patch = {};
    if (homeScore !== undefined) patch.homeScore = homeScore;
    if (awayScore !== undefined) patch.awayScore = awayScore;
    if (status) patch.status = status;
    if (minute !== undefined) patch.minute = minute;

    const updated = await Match.findOneAndUpdate(
      { matchId: id },
      { $set: patch },
      { new: true, lean: true }
    );

    if (!updated) return res.status(404).json({ error: 'Match not found' });

    const allMatches = await Match.find().lean();
    broadcastToSSE({
      type: 'MATCH_SCORE_UPDATED',
      matchId: id,
      patch,
      matches: allMatches.map(m => ({ ...m, id: m.matchId })),
    });

    res.json({ message: 'Score updated', match: { ...updated, id: updated.matchId } });
  } catch (err) {
    console.error('updateScore error:', err);
    res.status(500).json({ error: 'Failed to update score' });
  }
};

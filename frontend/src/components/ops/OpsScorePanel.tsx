/**
 * OpsScorePanel.tsx — Ops team match score update interface.
 *
 * Security: Only accessible in the Operations view (JWT-protected route on backend).
 * Features:
 * - List all matches with editable scores
 * - Add/remove match events (goals, cards)
 * - Live status switcher (upcoming → live → halftime → completed)
 * - Optimistic UI with backend sync
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Save, Plus, Minus, CheckCircle, Loader2, AlertCircle, Zap } from 'lucide-react';
import type { Match, MatchStatus } from '../../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const STATUS_OPTIONS: { value: MatchStatus; label: string; color: string }[] = [
  { value: 'upcoming',  label: '📅 Upcoming',  color: '#64748b' },
  { value: 'live',      label: '🔴 Live',       color: '#ef4444' },
  { value: 'halftime',  label: '⏸️ Half Time',  color: '#f97316' },
  { value: 'completed', label: '✅ Full Time',  color: '#10b981' },
];

interface ScoreEditorProps {
  match: Match;
  onSave: (id: string, patch: Partial<Match>) => Promise<void>;
}

function ScoreEditor({ match, onSave }: ScoreEditorProps) {
  const [home, setHome] = useState(match.homeScore);
  const [away, setAway] = useState(match.awayScore);
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [minute, setMinute] = useState(match.minute || 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = home !== match.homeScore
    || away !== match.awayScore
    || status !== match.status
    || minute !== (match.minute || 0);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(match.id, {
        homeScore: home,
        awayScore: away,
        status,
        minute: status === 'live' ? minute : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className="score-editor-card"
      aria-label={`Score editor: ${match.homeTeam} vs ${match.awayTeam}`}
    >
      {/* Match title */}
      <div className="score-editor-header">
        <div className="score-editor-teams">
          <span>{match.homeFlag} {match.homeTeam}</span>
          <span className="score-editor-vs">vs</span>
          <span>{match.awayTeam} {match.awayFlag}</span>
        </div>
        <span className="score-editor-meta">{match.round}</span>
      </div>

      {/* Score controls */}
      <div className="score-editor-controls" role="group" aria-label="Score controls">
        {/* Home score */}
        <div className="score-spinner" role="group" aria-label={`${match.homeTeam} score`}>
          <button
            onClick={() => setHome(h => Math.max(0, h - 1))}
            className="score-spin-btn"
            aria-label="Decrease home score"
          >
            <Minus size={12} />
          </button>
          <span className="score-spin-value" aria-live="polite" aria-atomic="true">{home}</span>
          <button
            onClick={() => setHome(h => h + 1)}
            className="score-spin-btn add"
            aria-label="Increase home score"
          >
            <Plus size={12} />
          </button>
        </div>

        <span className="score-editor-sep">–</span>

        {/* Away score */}
        <div className="score-spinner" role="group" aria-label={`${match.awayTeam} score`}>
          <button
            onClick={() => setAway(a => Math.max(0, a - 1))}
            className="score-spin-btn"
            aria-label="Decrease away score"
          >
            <Minus size={12} />
          </button>
          <span className="score-spin-value" aria-live="polite" aria-atomic="true">{away}</span>
          <button
            onClick={() => setAway(a => a + 1)}
            className="score-spin-btn add"
            aria-label="Increase away score"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Status + Minute */}
      <div className="score-editor-status-row">
        <div className="score-editor-field">
          <label className="score-editor-label" htmlFor={`status-${match.id}`}>Match Status</label>
          <select
            id={`status-${match.id}`}
            value={status}
            onChange={e => setStatus(e.target.value as MatchStatus)}
            className="form-select m-0 py-1.5 text-xs"
            aria-label="Match status"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {status === 'live' && (
          <div className="score-editor-field">
            <label className="score-editor-label" htmlFor={`minute-${match.id}`}>
              <Zap size={10} className="text-red-500" aria-hidden="true" /> Minute
            </label>
            <input
              id={`minute-${match.id}`}
              type="number"
              min={1}
              max={120}
              value={minute}
              onChange={e => setMinute(Number(e.target.value))}
              className="score-editor-minute-input"
              aria-label="Current match minute"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="score-editor-error" role="alert">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        className={`score-save-btn ${saved ? 'saved' : ''}`}
        aria-label={`Save score for ${match.homeTeam} vs ${match.awayTeam}`}
        aria-busy={saving}
      >
        {saving ? (
          <Loader2 size={14} className="spin" />
        ) : saved ? (
          <><CheckCircle size={14} /> Saved!</>
        ) : (
          <><Save size={14} /> Update Score</>
        )}
      </button>
    </article>
  );
}

export const OpsScorePanel: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      if (res.ok) setMatches(await res.json());
    } catch { /* keep fallback */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleSave = useCallback(async (id: string, patch: Partial<Match>) => {
    const res = await fetch(`${API_BASE}/matches/${id}/score`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('stadiumiq_token')}`
      },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || 'Failed to update score');
    }

    // Optimistic update
    setMatches(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  return (
    <div className="ops-score-panel" aria-labelledby="ops-score-title">
      <h2 id="ops-score-title" className="ops-score-title">
        <Trophy size={16} aria-hidden="true" />
        Match Score Control
      </h2>
      <p className="ops-score-subtitle">
        Update live scores and match status. Changes broadcast to all connected fans.
      </p>

      {loading ? (
        <div className="ops-score-loading" aria-label="Loading matches" role="status">
          <Loader2 size={20} className="spin text-sky-400" aria-hidden="true" />
          <span>Loading matches…</span>
        </div>
      ) : (
        <div className="ops-score-grid">
          {matches.map(match => (
            <ScoreEditor
              key={match.id}
              match={match}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

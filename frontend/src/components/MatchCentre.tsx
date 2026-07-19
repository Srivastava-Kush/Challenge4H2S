/**
 * MatchCentre.tsx — Fan-facing live match scores and fixtures.
 *
 * Features:
 * - Live score ticker with animated "LIVE" badge
 * - Match events timeline (goals, cards)
 * - Filter by status (All / Live / Upcoming / Completed)
 * - Auto-polling every 30 seconds for live updates
 * - Fully accessible with ARIA labels and semantic HTML
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Clock, Filter, RefreshCw, Zap, CheckCircle, CalendarClock } from 'lucide-react';
import type { Match, MatchStatus } from '../types';

// Static fallback — used if the API is unreachable

const API_BASE = 'http://localhost:5000/api';
const POLL_INTERVAL_MS = 30_000;

const STATUS_LABELS: Record<MatchStatus, { label: string; color: string; icon: React.ReactNode }> = {
  live:      { label: 'LIVE',      color: '#ef4444', icon: <Zap size={11} /> },
  halftime:  { label: 'HT',        color: '#f97316', icon: <Clock size={11} /> },
  upcoming:  { label: 'Upcoming',  color: '#64748b', icon: <CalendarClock size={11} /> },
  completed: { label: 'FT',        color: '#10b981', icon: <CheckCircle size={11} /> },
};

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  penalty: '🎯',
};

type FilterType = 'all' | MatchStatus;

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',       label: '🗂️ All' },
  { id: 'live',      label: '🔴 Live' },
  { id: 'halftime',  label: '⏸️ Half Time' },
  { id: 'upcoming',  label: '📅 Upcoming' },
  { id: 'completed', label: '✅ Completed' },
];

function formatKickoff(utc: string): string {
  return new Date(utc).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

interface ScoreDisplayProps {
  match: Match;
}

function ScoreDisplay({ match }: ScoreDisplayProps) {
  const meta = STATUS_LABELS[match.status];
  const isActive = match.status === 'live' || match.status === 'halftime';

  return (
    <article
      className="match-card"
      aria-label={`${match.homeTeam} vs ${match.awayTeam}, ${meta.label}`}
    >
      {/* Header row */}
      <div className="match-card-header">
        <span className="match-round">{match.round} · {match.group || match.venue}</span>
        <span
          className="match-status-badge"
          style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}12` }}
          aria-live="polite"
        >
          {meta.icon}
          {meta.label}
          {match.status === 'live' && match.minute && ` ${match.minute}'`}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="match-scoreboard" role="presentation">
        {/* Home */}
        <div className="match-team home">
          <span className="match-flag" aria-hidden="true">{match.homeFlag}</span>
          <span className="match-team-name">{match.homeTeam}</span>
        </div>

        {/* Score */}
        <div className="match-score-block">
          {isActive || match.status === 'completed' ? (
            <span className="match-score" aria-label={`Score: ${match.homeScore} to ${match.awayScore}`}>
              {match.homeScore}
              <span className="match-score-sep">–</span>
              {match.awayScore}
            </span>
          ) : (
            <span className="match-kickoff-time">
              {new Date(match.kickoffUtc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {match.status === 'live' && (
            <span className="match-live-pulse" aria-hidden="true" />
          )}
        </div>

        {/* Away */}
        <div className="match-team away">
          <span className="match-team-name">{match.awayTeam}</span>
          <span className="match-flag" aria-hidden="true">{match.awayFlag}</span>
        </div>
      </div>

      {/* Upcoming kickoff */}
      {match.status === 'upcoming' && (
        <p className="match-kickoff-label">
          <Clock size={11} aria-hidden="true" />
          {formatKickoff(match.kickoffUtc)}
        </p>
      )}

      {/* Events timeline */}
      {match.events.length > 0 && (
        <details className="match-events">
          <summary className="match-events-toggle" aria-label="Show match events">
            Match Events ({match.events.length})
          </summary>
          <ol className="match-events-list" aria-label="Match timeline">
            {match.events.map((ev, i) => (
              <li key={i} className="match-event-row">
                <span className="match-event-minute" aria-label={`Minute ${ev.minute}`}>{ev.minute}'</span>
                <span className="match-event-icon" aria-hidden="true">{EVENT_ICONS[ev.type] || '•'}</span>
                <span className="match-event-detail">
                  <strong className="match-event-player">{ev.player}</strong>
                  {ev.description && <span className="match-event-desc"> — {ev.description}</span>}
                </span>
                <span className={`match-event-team ${ev.team}`}>{ev.team === 'home' ? '(H)' : '(A)'}</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </article>
  );
}

export const MatchCentre: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
        setLastUpdated(new Date());
      }
    } catch {
      // API offline — keep static data visible, silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Auto-poll for live updates
  useEffect(() => {
    const timer = setInterval(fetchMatches, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchMatches]);

  const handleRefresh = () => {
    setLoading(true);
    fetchMatches();
  };

  const filtered = filter === 'all'
    ? matches
    : matches.filter(m => m.status === filter);

  const liveCount = matches.filter(m => m.status === 'live' || m.status === 'halftime').length;

  return (
    <section className="match-centre" aria-labelledby="match-centre-title">
      {/* Header */}
      <div className="match-centre-header">
        <div>
          <h2 id="match-centre-title" className="match-centre-title">
            <Trophy size={20} aria-hidden="true" />
            Match Centre
          </h2>
          <p className="match-centre-subtitle">
            FIFA World Cup 2026 · MetLife Stadium
            {liveCount > 0 && (
              <span className="match-live-indicator" aria-label={`${liveCount} live matches`}>
                {liveCount} Live
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="match-refresh-btn"
          aria-label="Refresh match data"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span className="text-[10px] text-slate-500">
            {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
      </div>

      {/* Filter Tabs */}
      <nav className="match-filters" aria-label="Match status filter">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`category-tab ${filter === f.id ? 'active' : ''}`}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {/* Match List */}
      {filtered.length === 0 ? (
        <div className="match-empty" role="status">
          <Filter size={24} aria-hidden="true" />
          <p>No matches found for this filter.</p>
        </div>
      ) : (
        <div className="match-list" role="list" aria-label="Match list">
          {filtered.map(match => (
            <ScoreDisplay key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  );
};

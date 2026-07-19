import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Compass, Navigation, Search, MapPin, Bell, Clock, Footprints, ChevronRight } from 'lucide-react';
import type { Node, RouteResult, CrowdData } from '../utils/routing';
import { useAuth } from '../contexts/AuthContext';

interface FanPortalProps {
  nodes: Node[];
  language: string;
  accessibilityMode: boolean;
  onChangeAccessibility: (checked: boolean) => void;
  startNodeId: string;
  onChangeStartNode: (id: string) => void;
  destNodeId: string;
  onChangeDestNode: (id: string) => void;
  activeRoute: RouteResult | null;
  chatHistory: Array<{ sender: 'user' | 'bot'; text: string; isRtl?: boolean; sources?: string[]; crowdWarning?: string }>;
  crowd: CrowdData;
  alerts: any[];
}

// Node type → icon + emoji + color
const NODE_TYPE_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  gate: { emoji: '🚪', label: 'Gate', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  section: { emoji: '🪑', label: 'Seat Section', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  restroom: { emoji: '🚻', label: 'Restroom', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  food: { emoji: '🍔', label: 'Food', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  medical: { emoji: '🏥', label: 'First Aid', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  prayer: { emoji: '🕌', label: 'Prayer Room', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  lift: { emoji: '🛗', label: 'Lift', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  corridor: { emoji: '🚶', label: 'Concourse', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

// Category tabs
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🗺️' },
  { id: 'gate', label: 'Gates', icon: '🚪' },
  { id: 'section', label: 'Seats', icon: '🪑' },
  { id: 'facility', label: 'Facilities', icon: '🏥' },
];

// Quick-action shortcuts (facility types)
const QUICK_ACTIONS = [
  { type: 'restroom', label: 'Nearest Restroom', emoji: '🚻', color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
  { type: 'food', label: 'Nearest Food', emoji: '🍔', color: '#eab308', glow: 'rgba(234,179,8,0.3)' },
  { type: 'medical', label: 'First Aid', emoji: '🏥', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  { type: 'prayer', label: 'Prayer Room', emoji: '🕌', color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { type: 'lift', label: 'Lift / Elevator', emoji: '🛗', color: '#ec4899', glow: 'rgba(236,72,153,0.3)' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
];

void LANGUAGES;

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    findMyWay: 'Find My Way',
    whereAreYou: '📍 Where are you now?',
    stepFree: '♿ Step-free route',
    stepFreeDesc: 'Avoids stairs, prefers lifts and ramps',
    quickDest: '⚡ Quick Destinations',
    searchDest: '🔍 Search Destination',
    stepByStep: 'Step-by-Step Directions',
    signOut: 'Sign Out'
  },
  ar: {
    findMyWay: 'أوجد طريقي',
    whereAreYou: '📍 أين أنت الآن؟',
    stepFree: '♿ طريق بدون سلالم',
    stepFreeDesc: 'يتجنب السلالم ويفضل المصاعد والمنحدرات',
    quickDest: '⚡ وجهات سريعة',
    searchDest: '🔍 ابحث عن وجهة',
    stepByStep: 'اتجاهات خطوة بخطوة',
    signOut: 'تسجيل خروج'
  },
  es: {
    findMyWay: 'Encuentra mi camino',
    whereAreYou: '📍 ¿Dónde estás ahora?',
    stepFree: '♿ Ruta sin escaleras',
    stepFreeDesc: 'Evita escaleras, prefiere ascensores y rampas',
    quickDest: '⚡ Destinos rápidos',
    searchDest: '🔍 Buscar destino',
    stepByStep: 'Direcciones paso a paso',
    signOut: 'Cerrar sesión'
  }
};

function t(key: string, lang: string): string {
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) return TRANSLATIONS[lang][key];
  return TRANSLATIONS['en'][key] || key;
}

function getFloorLabel(level: string) {
  if (level === 'ground') return 'Ground Floor';
  if (level === '100') return 'Level 1 (100s)';
  if (level === '200') return 'Level 2 (200s)';
  if (level === '300') return 'Level 3 (300s)';
  return `Level ${level}`;
}

export const FanPortal: React.FC<FanPortalProps> = ({
  nodes,
  language,
  accessibilityMode,
  onChangeAccessibility,
  startNodeId,
  onChangeStartNode,
  destNodeId,
  onChangeDestNode,
  activeRoute,
  chatHistory,
  crowd,
  alerts,
}) => {
  const { user, logout } = useAuth();
  const [destSearch, setDestSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const gates = nodes.filter(n => n.type === 'gate');
  const facilityTypes = ['restroom', 'food', 'medical', 'prayer', 'lift'];

  // Avg crowd density for stat chip
  const crowdValues = Object.values(crowd.nodes || {}).map(n => n.density);
  const avgCrowd = crowdValues.length ? Math.round(crowdValues.reduce((a, b) => a + b, 0) / crowdValues.length) : 0;
  const crowdLevel = avgCrowd < 40 ? 'Low' : avgCrowd < 60 ? 'Moderate' : avgCrowd < 80 ? 'High' : 'Critical';
  const crowdColor = avgCrowd < 40 ? '#10b981' : avgCrowd < 60 ? '#d97706' : avgCrowd < 80 ? '#ea580c' : '#dc2626';

  // Filter destinations by search + category
  const filteredNodes = useMemo(() => {
    let filtered = nodes.filter(n => n.type !== 'corridor');

    if (activeCategory === 'gate') filtered = filtered.filter(n => n.type === 'gate');
    else if (activeCategory === 'section') filtered = filtered.filter(n => n.type === 'section');
    else if (activeCategory === 'facility') filtered = filtered.filter(n => facilityTypes.includes(n.type));

    if (destSearch.trim()) {
      const q = destSearch.toLowerCase();
      filtered = filtered.filter(n => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
    }

    return filtered;
  }, [nodes, activeCategory, destSearch]);

  const handleQuickAction = (type: string) => {
    const match = nodes.find(n => n.type === type);
    if (match) onChangeDestNode(match.id);
    setDestSearch('');
  };

  const currentNode = nodes.find(n => n.id === startNodeId);
  const destNode = nodes.find(n => n.id === destNodeId);

  return (
    <section aria-label="Fan Portal" className="flex flex-col gap-5 h-full overflow-y-auto pr-1">

      {/* ── User Header Strip ── */}
      {user && (
        <div className="user-header-strip">
          <div className="flex items-center gap-2">
            <div className="user-avatar">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                : <span>{user.name.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">👋 {user.name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user.role} · {user.authProvider === 'google' ? '🟦 Google' : '🔐 JWT'}</div>
            </div>
          </div>
          <button onClick={logout} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors border border-slate-800 px-2 py-1 rounded-md">
            {t('signOut', language)}
          </button>
        </div>
      )}

      {/* ── Live Stat Chips ── */}
      <div className="stat-chips-row">
        <div className="stat-chip" title="Average crowd density">
          <span className="stat-chip-dot" style={{ background: crowdColor }} />
          <span className="stat-chip-label">Crowd</span>
          <span className="stat-chip-value" style={{ color: crowdColor }}>{crowdLevel}</span>
        </div>
        <div className="stat-chip" title="Active alerts">
          <Bell size={11} className="text-amber-500" />
          <span className="stat-chip-label">Alerts</span>
          <span className="stat-chip-value text-amber-400">{alerts.filter(a => !a.acknowledged).length}</span>
        </div>
        {activeRoute && (
          <>
            <div className="stat-chip" title="Route distance">
              <Footprints size={11} className="text-sky-400" />
              <span className="stat-chip-label">Distance</span>
              <span className="stat-chip-value text-sky-300">{activeRoute.totalDistance}m</span>
            </div>
            <div className="stat-chip" title="Estimated walk time">
              <Clock size={11} className="text-emerald-400" />
              <span className="stat-chip-label">ETA</span>
              <span className="stat-chip-value text-emerald-300">{parseFloat((activeRoute.totalTime / 60).toFixed(1))} min</span>
            </div>
          </>
        )}
      </div>

      {/* ── Find Your Way Card ── */}
      <article className="glass-panel flex flex-col gap-4" aria-labelledby="find-my-way-title">
        <div className="flex justify-between items-center">
          <h2 id="find-my-way-title" className="text-xl font-bold flex items-center gap-2 m-0">
            <Compass className="text-sky-500" size={20} aria-hidden="true" />
            {t('findMyWay', language)}
          </h2>
        </div>

        {/* You Are Here selector */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            {t('whereAreYou', language)}
          </label>
          <select
            value={startNodeId}
            onChange={e => onChangeStartNode(e.target.value)}
            className="form-select m-0"
            aria-label="Starting location"
          >
            {gates.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Accessibility toggle */}
        <div className="switch-container">
          <input
            type="checkbox"
            id="accessibility-check"
            className="switch-input"
            checked={accessibilityMode}
            onChange={e => onChangeAccessibility(e.target.checked)}
          />
          <div>
            <label htmlFor="accessibility-check" className="switch-label font-bold flex items-center gap-1.5 cursor-pointer">
              {t('stepFree', language)}
            </label>
            <div className="switch-subtext">{t('stepFreeDesc', language)}</div>
          </div>
        </div>

        {/* Quick Action Cards (StadiumIQ-inspired) */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-2">{t('quickDest', language)}</label>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map(action => {
              const isActive = nodes.find(n => n.type === action.type)?.id === destNodeId;
              return (
                <button
                  key={action.type}
                  onClick={() => handleQuickAction(action.type)}
                  className={`quick-action-card ${isActive ? 'active' : ''}`}
                  style={isActive ? { borderColor: action.color, boxShadow: `0 0 16px ${action.glow}` } : {}}
                >
                  <span className="quick-action-emoji">{action.emoji}</span>
                  <span className="quick-action-label">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Category Tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-2">{t('searchDest', language)}</label>

          {/* Category Tabs */}
          <div className="category-tabs" role="tablist" aria-label="Destination Categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Type gate, section, food, prayer..."
              value={destSearch}
              onChange={e => setDestSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="search-input"
            />
          </div>

          {/* Results Dropdown / List */}
          {(searchFocused || destSearch) && (
            <div className="search-results" aria-live="polite">
              {filteredNodes.length === 0 && (
                <div className="search-no-result">No results found</div>
              )}
              {filteredNodes.slice(0, 10).map(node => {
                const meta = NODE_TYPE_META[node.type] || NODE_TYPE_META.corridor;
                const isSelected = node.id === destNodeId;
                return (
                  <button
                    key={node.id}
                    onClick={() => { onChangeDestNode(node.id); setDestSearch(''); }}
                    className={`search-result-item ${isSelected ? 'active' : ''}`}
                  >
                    <span className="search-result-emoji">{meta.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-semibold text-slate-200">{node.name}</div>
                      <div className="text-[10px] text-slate-500">{meta.label} · {getFloorLabel(node.level)}</div>
                    </div>
                    {isSelected && <ChevronRight size={12} className="text-sky-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </article>

      {/* ── Step-by-Step Directions ── */}
      <div className="glass-panel">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Navigation size={14} className="text-sky-500" />
          {t('stepByStep', language)}
        </h3>

        {activeRoute ? (
          <div className="flex flex-col gap-3">
            {/* Route Summary Card */}
            <div className="route-summary-card">
              <div className="route-summary-row">
                <div className="route-summary-from">
                  <MapPin size={12} className="text-white" />
                  <span>{currentNode?.name || 'Start'}</span>
                </div>
                <ChevronRight size={12} className="text-slate-500" />
                <div className="route-summary-to">
                  <MapPin size={12} className="text-sky-400" />
                  <span>{destNode?.name || 'Destination'}</span>
                </div>
              </div>
              <div className="route-summary-meta">
                <span className="route-meta-chip distance">
                  <Footprints size={10} /> {activeRoute.totalDistance}m
                </span>
                <span className="route-meta-chip time">
                  <Clock size={10} /> ~{parseFloat((activeRoute.totalTime / 60).toFixed(1))} min
                </span>
                <span className="route-meta-chip hops">
                  {activeRoute.path.length} waypoints
                </span>
                {activeRoute.routeAdjusted && (
                  <span className="route-meta-chip adjusted">
                    ⚠️ Rerouted (crowd)
                  </span>
                )}
                {accessibilityMode && (
                  <span className="route-meta-chip accessible">
                    ♿ Step-free
                  </span>
                )}
              </div>

              {/* ETA Progress Bar */}
              <div className="eta-bar-wrap">
                <div className="eta-bar-label">
                  <Clock size={10} className="text-sky-400" />
                  Walking time
                </div>
                <div className="eta-bar-track">
                  <div
                    className="eta-bar-fill"
                    style={{ width: `${Math.min(100, (activeRoute.totalTime / 600) * 100)}%` }}
                  />
                </div>
                <div className="eta-bar-value">{parseFloat((activeRoute.totalTime / 60).toFixed(1))} min</div>
              </div>
            </div>

            {/* Steps List */}
            <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
              {activeRoute.path.map((node, i) => {
                const isFirst = i === 0;
                const isLast = i === activeRoute.path.length - 1;
                const edge = i > 0 ? activeRoute.edges[i - 1] : null;
                const meta = NODE_TYPE_META[node.type] || NODE_TYPE_META.corridor;

                let stepText = '';
                if (isFirst) {
                  stepText = `Start at ${node.name}`;
                } else if (isLast) {
                  stepText = `Arrived at ${node.name}`;
                } else {
                  stepText = `Walk ${edge?.distance || 0}m to ${node.name}`;
                }

                return (
                  <div key={node.id} className="step-row">
                    <div className="step-connector">
                      <div
                        className={`step-dot ${isFirst ? 'start' : isLast ? 'end' : 'mid'}`}
                        style={!isFirst && !isLast ? { background: meta.color } : {}}
                      >
                        {isFirst ? '📍' : isLast ? '🏁' : meta.emoji}
                      </div>
                      {!isLast && <div className="step-line" />}
                    </div>
                    <div className="step-content">
                      <div className="step-text">{stepText}</div>
                      <div className="step-meta">
                        <span className="step-floor">{getFloorLabel(node.level)}</span>
                        {edge?.stairs && <span className="step-stairs">🪜 stairs</span>}
                        {node.type === 'lift' && accessibilityMode && <span className="step-accessible">♿ via lift</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-6 text-center flex flex-col items-center gap-2">
            <Compass size={24} className="text-slate-700" />
            Select a start gate and destination to compute route
          </div>
        )}
      </div>

    </section>
  );
};

import { useState, useEffect, useRef } from 'react';
import { Compass, ShieldAlert, RefreshCw, Shield, Utensils, Trophy, MessageSquare, ClipboardList, Languages } from 'lucide-react';
import { findRoute } from './utils/routing';
import type { Node, Edge, CrowdData, RouteResult } from './utils/routing';
import type { AlertItem, IncidentItem, QueueItem } from './types';
import { MapView } from './components/MapView';
import { FanPortal } from './components/FanPortal';
import { OpsPortal } from './components/OpsPortal';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MatchCentre } from './components/MatchCentre';
import { FoodOrder } from './components/FoodOrder';
import { Chatbot } from './components/Chatbot';
import { LandingPage } from './components/LandingPage';
import { VolunteerPortal } from './components/VolunteerPortal';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
];

function StadiumApp() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      setShowLanding(false);
    }
  }, [user]);
  const [activeView, setActiveView] = useState<'fan' | 'ops' | 'volunteer' | 'match' | 'food' | 'chat'>('fan');
  const [language, setLanguage] = useState<string>('en');
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);

  // Navigation State
  const [startNodeId, setStartNodeId] = useState<string>('gate_metlife');
  const [destNodeId, setDestNodeId] = useState<string>('prayer_1');
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);

  // Database state — initialized empty, populated from API
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [crowd, setCrowd] = useState<CrowdData>({ nodes: {}, edges: {} } as CrowdData);
  const [stadium, setStadium] = useState<{ name?: string; dimensions?: { width?: number; height?: number }; theme?: { background?: string } } | null>(null);

  // Dynamic Sim/Telemetry State
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [simTime, setSimTime] = useState<string>('2026-07-17T18:30:00Z');
  const [serverConnected, setServerConnected] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);


  // Chat/AI State
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; isRtl?: boolean }>>([
    { sender: 'bot', text: 'Hello! I am your FIFA 2026 Stadium Assistant. Select where you are, your destination, or ask me anything!' }
  ]);

  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Fetch metadata on load & connect to SSE
  useEffect(() => {
    // Try loading configurations from API backend
    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_BASE}/map`);
        if (!response.ok) throw new Error(`Map API returned ${response.status}`);

        const mapData = await response.json();
        setStadium(mapData.stadium);
        const databaseNodes = Array.isArray(mapData.nodes) ? mapData.nodes : [];
        const databaseEdges = Array.isArray(mapData.edges) ? mapData.edges : [];
        setNodes(databaseNodes);
        setEdges(databaseEdges);
        setCrowd(mapData.crowd || { timestamp: new Date().toISOString(), nodes: {}, edges: {} });

        // Database IDs are authoritative; choose valid defaults after the graph arrives.
        const firstGate = databaseNodes.find((node: Node) => node.type === 'gate') || databaseNodes[0];
        const firstDestination = databaseNodes.find((node: Node) => node.type !== 'gate' && node.id !== firstGate?.id);
        if (firstGate) setStartNodeId(firstGate.id);
        if (firstDestination) setDestNodeId(firstDestination.id);
      } catch (err) {
        console.warn('Unable to load navigation data from the API.', err);
      }
    };

    loadConfig();

    // Setup EventSource for SSE Telemetry Stream
    const connectSSE = () => {
      console.log('Connecting to SSE Telemetry stream...');
      const es = new EventSource(`${API_BASE}/telemetry`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setServerConnected(true);
        console.log('SSE Stream connected successfully.');
      };

      es.onerror = (err) => {
        setServerConnected(false);
        console.warn('SSE disconnected. Re-trying or falling back to local simulation...', err);
        es.close();
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TELEMETRY_TICK') {
            setCrowd(data.crowd);
            setIncidents(data.incidents);
            setAlerts(data.alerts);
            setQueues(data.queues);
            setSimTime(data.timestamp);
          } else if (data.type === 'INCIDENT_REPORTED') {
            setIncidents(data.incidents);
          } else if (data.type === 'ALERT_ACKNOWLEDGED') {
            setAlerts(data.alerts);
            setCrowd(data.crowd);
          } else if (data.type === 'INCIDENTS_UPDATED') {
            setIncidents(data.incidents);
          } else if (data.type === 'ALERTS_UPDATED') {
            setAlerts(data.alerts);
          }
        } catch (e) {
          console.error('Error parsing telemetry SSE data:', e);
        }
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);


  // 2. Perform path recalculation when selections change
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const route = findRoute(startNodeId, destNodeId, nodes, edges, crowd, accessibilityMode);
      setActiveRoute(route);
    } else {
      setActiveRoute(null);
    }
  }, [startNodeId, destNodeId, nodes, edges, crowd, accessibilityMode]);

  // Handle node selection from map clicks
  const handleSelectNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Select logic: toggling start/dest
    if (node.type === 'gate') {
      setStartNodeId(nodeId);
    } else {
      setDestNodeId(nodeId);
    }
  };

  // 3. Multilingual RAG Chat submission handler
  const handleSendMessage = async (msg: string) => {
    const userBubble = { sender: 'user' as const, text: msg };
    setChatHistory(prev => [...prev, userBubble]);

    // Send query to Server RAG endpoint
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          language,
          accessibilityMode,
          startNodeId,
          destNodeId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, {
          sender: 'bot',
          text: data.reply,
          isRtl: data.language === 'ar',
          sources: data.sources || [],
          crowdWarning: data.crowd?.hasWarning ? data.crowd.summary : undefined
        }]);

        // If a route was calculated, update active pointers
        if (data.route && data.route.path) {
          const path = data.route.path;
          if (path.length > 0) {
            setStartNodeId(path[0].id);
            setDestNodeId(path[path.length - 1].id);
            if (data.route.accessible !== undefined) {
              setAccessibilityMode(data.route.accessible);
            }
          }
        }
      } else if (response.status === 429) {
        setChatHistory(prev => [...prev, {
          sender: 'bot',
          text: '⚠️ Rate limit exceeded. Please wait a moment before sending another query.'
        }]);
      } else {
        throw new Error('Server returned an error');
      }
    } catch (err) {
      // Standalone Client RAG fallback
      const reply = getLocalRAGReply(msg);
      setChatHistory(prev => [...prev, {
        sender: 'bot',
        text: reply,
        isRtl: language === 'ar'
      }]);
    }
  };

  // Standalone RAG matching rules
  const getLocalRAGReply = (query: string): string => {
    const lower = query.toLowerCase();

    // Check for jailbreaks/prompt injection attempts locally
    const checkInjection = /ignore previous|override|dan mode/i.test(lower);
    if (checkInjection) {
      return "⚠️ Prompt-injection or system override attempt detected. Access denied.";
    }

    if (lower.includes('restroom') || lower.includes('toilet') || lower.includes('washroom')) {
      return "🚽 Restroom 1 is located on the South Concourse near Section 140. It is fully accessible (step-free) and offers grab bars for wheelchair users.";
    }
    if (lower.includes('food') || lower.includes('eat') || lower.includes('stand')) {
      return "🍔 Food Stand 1 is on the South Concourse. It serves Halal, Kosher, Vegetarian, and Gluten-free concessions.";
    }
    if (lower.includes('first aid') || lower.includes('medical')) {
      return "🚑 First Aid 1 is located on the West Concourse. Safe pathways are available via the South-West Corridor.";
    }
    if (lower.includes('prayer') || lower.includes('mosque')) {
      return "🕌 Prayer Room 1 (Multi-faith room) is located on the East Concourse (x: 650, y: 470). Proceed from the corridor walkway.";
    }
    if (lower.includes('translate') || lower.includes('arabic')) {
      return "مرحباً بك! أنا المساعد الذكي لمستشعرات الاستاد. تفضل بطلب خط التوجيه.";
    }
    return "I couldn't locate specific documents for your question. Please try asking about gates, restrooms, food stands, first-aid, or prayer rooms.";
  };

  // 4. Alert Mitigation
  const handleMitigateAlert = async (alertId: string) => {
    try {
      const res = await fetch(`${API_BASE}/mitigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('stadiumiq_token') ? { Authorization: `Bearer ${localStorage.getItem('stadiumiq_token')}` } : {}) },
        body: JSON.stringify({ alertId })
      });
      if (!res.ok) throw new Error('API mitigate failed');
    } catch (err) {
      // Local mitigation logic fallback
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));

      // Update local crowd densities
      setCrowd(prev => {
        const updated = { ...prev };
        if (updated.nodes["gate_verizon"]) {
          updated.nodes["gate_verizon"].density = 48;
          updated.nodes["gate_verizon"].status = "medium";
        }
        if (updated.nodes["gate_pepsi"]) {
          updated.nodes["gate_pepsi"].density = 52;
        }
        if (updated.edges["gate_verizon_corridor_east"]) {
          updated.edges["gate_verizon_corridor_east"].density = 48;
        }
        return updated;
      });
    }
  };

  // 5. Submit Incident Report (Triage)
  const handleReportIncident = async (desc: string, loc: string) => {
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('stadiumiq_token') ? { Authorization: `Bearer ${localStorage.getItem('stadiumiq_token')}` } : {}) },
        body: JSON.stringify({ description: desc, location: loc })
      });
      if (!res.ok) throw new Error('API incident report failed');
    } catch (err) {
      // Local Incident triage fallback
      const descLower = desc.toLowerCase();
      let category = "General";
      let priority: 'Low' | 'Medium' | 'High' = "Low";
      let assignedTo = "Steward Support";

      if (descLower.includes("spill") || descLower.includes("water") || descLower.includes("garbage")) {
        category = "Cleaning";
        priority = "Low";
        assignedTo = "Clean Crew Section B";
      } else if (descLower.includes("hurt") || descLower.includes("medical") || descLower.includes("collapse")) {
        category = "Medical";
        priority = "High";
        assignedTo = "Paramedic Unit 2";
      } else if (descLower.includes("fight") || descLower.includes("security")) {
        category = "Security";
        priority = "High";
        assignedTo = "Rapid Response Security";
      }

      const newIncident = {
        id: `incident-${Date.now()}`,
        category,
        description: desc,
        priority,
        location: loc,
        assignedTo,
        status: "Active",
        timestamp: new Date().toISOString()
      };

      setIncidents(prev => [newIncident, ...prev]);
    }
  };

  const handleUpdateIncident = async (incidentId: string, status: string) => {
    const response = await fetch(`${API_BASE}/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('stadiumiq_token') ? { Authorization: `Bearer ${localStorage.getItem('stadiumiq_token')}` } : {}) },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to update incident');
    setIncidents(previous => previous.map(incident => incident.id === incidentId ? data.incident : incident));
  };

  // 6. Ops Copilot NLP Queries
  const handleSendCopilotQuery = async (query: string, callback: (ans: string, action: any) => void) => {
    try {
      const res = await fetch(`${API_BASE}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        callback(data.answer, data.actionRequired);
      } else {
        throw new Error('Copilot API failed');
      }
    } catch (err) {
      // Local Copilot fallback logic
      const qLower = query.toLowerCase();
      let answer = "";
      let actionRequired = null;

      if (qLower.includes('gates') || qLower.includes('capacity') || qLower.includes('over')) {
        const activeAlert = alerts.find(a => !a.acknowledged);
        if (activeAlert) {
          answer = "Verizon Gate is currently operating at 78% capacity with an expected queue buildup. High congestion on East Concourse.";
          actionRequired = {
            type: "MITIGATE_OVERFLOW",
            alertId: "alert-1",
            description: "Open Pepsi Gate overflow and route fans via the West Concourse."
          };
        } else {
          answer = "All gates are running normally. No warnings are active.";
        }
      } else {
        answer = "I can analyze gate queues and active incidents. Try asking: 'Which gates are over 80%?'";
      }
      callback(answer, actionRequired);
    }
  };

  // 7. Start / Trigger Local Simulation loop
  const toggleLocalSimulation = () => {
    setIsDemoRunning(prev => !prev);
  };

  // Local simulation intervals if server is offline
  useEffect(() => {
    if (isDemoRunning && !serverConnected) {
      const interval = setInterval(() => {
        setCrowd(prev => {
          const updated = { ...prev };
          const alert = alerts.find(a => a.id === "alert-1");

          if (alert && !alert.acknowledged) {
            // Build congestion on Verizon gate
            if (updated.nodes["gate_verizon"].density < 84) {
              updated.nodes["gate_verizon"].density += 2;
            }
            if (updated.edges["gate_verizon_corridor_east"]) {
              updated.edges["gate_verizon_corridor_east"].density += 2;
            }
          }
          return updated;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isDemoRunning, serverConnected, alerts]);

  if (showAuth && !user) {
    return <AuthPage onAuthSuccess={() => setShowAuth(false)} onCancel={() => setShowAuth(false)} />;
  }

  if (showLanding && !user) {
    return <LandingPage onExplore={() => setShowLanding(false)} onAuthenticate={() => setShowAuth(true)} />;
  }

  return (
    <div className="app-container">
      {/* Screen-reader live region — announces route changes */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {activeRoute
          ? `Route calculated: ${activeRoute.path.length > 0 ? activeRoute.path[0].name : ''} to ${
              activeRoute.path.length > 0 ? activeRoute.path[activeRoute.path.length - 1].name : ''
            }, ${activeRoute.totalDistance} metres, approximately ${parseFloat((activeRoute.totalTime / 60).toFixed(1))} minutes.`
          : ''}
      </div>
      {/* Dynamic Header */}
      <header className="header-bar">
        <div className="logo-container">
          <div className="logo-shield">
            <Shield size={18} />
          </div>
          <span className="logo-text">{activeView === 'ops' ? `${stadium?.name || 'StadiumIQ'} OPS` : (stadium?.name || 'StadiumIQ')}</span>
          <span className="logo-badge">{activeView === 'ops' ? 'Control Room' : 'Fan App'}</span>
          <span className={`w-2 h-2 rounded-full inline-block ${serverConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} title={serverConnected ? 'Connected to telemetry server' : 'Running locally'} />
        </div>

        {/* View Switcher Pill */}
        <nav className="view-switcher" aria-label="Main Navigation">
          <button
            onClick={() => setActiveView('fan')}
            className={`view-btn ${activeView === 'fan' ? 'active' : ''}`}
            aria-pressed={activeView === 'fan'}
          >
            <Compass size={16} aria-hidden="true" /> Navigate
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`view-btn ${activeView === 'chat' ? 'active' : ''}`}
            aria-pressed={activeView === 'chat'}
          >
            <MessageSquare size={16} aria-hidden="true" /> Concierge
          </button>
          <button
            onClick={() => setActiveView('match')}
            className={`view-btn ${activeView === 'match' ? 'active' : ''}`}
            aria-pressed={activeView === 'match'}
          >
            <Trophy size={16} aria-hidden="true" /> Match Centre
          </button>
          <button
            onClick={() => setActiveView('food')}
            className={`view-btn ${activeView === 'food' ? 'active' : ''}`}
            aria-pressed={activeView === 'food'}
          >
            <Utensils size={16} aria-hidden="true" /> Food Order
          </button>
          {user?.role === 'ops' && (
            <button
              onClick={() => setActiveView('ops')}
              className={`view-btn ${activeView === 'ops' ? 'active' : ''}`}
              aria-pressed={activeView === 'ops'}
            >
              <ShieldAlert size={16} aria-hidden="true" /> Operations
            </button>
          )}
          {user?.role === 'volunteer' && <button onClick={() => setActiveView('volunteer')} className={`view-btn ${activeView === 'volunteer' ? 'active' : ''}`} aria-pressed={activeView === 'volunteer'}><ClipboardList size={16} aria-hidden="true" /> Volunteer</button>}
        </nav>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <label className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-2 py-1.5 rounded-lg min-h-[24px]" title="Website language">
            <Languages size={13} className="text-slate-400" aria-hidden="true" />
            <select value={language} onChange={event => setLanguage(event.target.value)} className="bg-transparent border-none text-xs text-slate-300 outline-none font-semibold cursor-pointer min-h-[24px]" style={{ minHeight: '24px' }} aria-label="Website language">
              {LANGUAGES.map(item => <option key={item.code} value={item.code} className="bg-slate-900">{item.label}</option>)}
            </select>
          </label>
          {!user && <button onClick={() => setShowAuth(true)} className="btn-secondary py-1 px-3 text-xs">Login / Sign up</button>}
          {user && <span className="text-slate-300">{user.name} · {user.role}</span>}
          <span>Seed 2026</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-mono">{new Date(simTime).toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Main Content Layout */}
      <main
        className="main-content"
        aria-label="Stadium application content"
        style={{
          gridTemplateColumns: activeView === 'fan' ? '400px 1fr' : activeView === 'ops' ? '1fr 440px' : '1fr'
        }}
      >
        {activeView === 'fan' && (
          <>
            {/* Fan Control Panel */}
            <FanPortal
              nodes={nodes}
              language={language}
              accessibilityMode={accessibilityMode}
              onChangeAccessibility={setAccessibilityMode}
              startNodeId={startNodeId}
              onChangeStartNode={setStartNodeId}
              destNodeId={destNodeId}
              onChangeDestNode={setDestNodeId}
              activeRoute={activeRoute}
              chatHistory={chatHistory}
              crowd={crowd}
              alerts={alerts}
            />
            {/* Map View */}
            <MapView
              nodes={nodes}
              edges={edges}
              crowd={crowd}
              stadium={stadium}
              activeRoute={activeRoute ? activeRoute.path : null}
              startNodeId={startNodeId}
              destNodeId={destNodeId}
              onSelectNode={handleSelectNode}
            />
          </>
        )}
        {activeView === 'ops' && (
          <>
            {/* Map View on Left */}
            <MapView
              nodes={nodes}
              edges={edges}
              crowd={crowd}
              stadium={stadium}
              activeRoute={activeRoute ? activeRoute.path : null}
              startNodeId={startNodeId}
              destNodeId={destNodeId}
              onSelectNode={handleSelectNode}
            />
            {/* Operations Dashboard on Right */}
            <OpsPortal
              queues={queues}
              incidents={incidents}
              alerts={alerts}
              onMitigateAlert={handleMitigateAlert}
              onReportIncident={handleReportIncident}
              onSendCopilotQuery={handleSendCopilotQuery}
              nodes={nodes}
              onUpdateIncident={handleUpdateIncident}
            />
          </>
        )}
        {activeView === 'volunteer' && user?.role === 'volunteer' && <VolunteerPortal nodes={nodes} />}
        {activeView === 'match' && (
          <div className="overflow-y-auto max-h-full">
            <MatchCentre />
          </div>
        )}
        {activeView === 'food' && (
          <div className="overflow-y-auto max-h-full">
            <FoodOrder />
          </div>
        )}
        {activeView === 'chat' && (
          <div className="overflow-y-auto max-h-full">
            <Chatbot
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              language={language}
            />
          </div>
        )}
      </main>

      {/* Footer bar for simulation playback */}
      <footer className="px-8 py-3 bg-slate-950/90 border-t border-slate-900 flex justify-between items-center text-xs">
        <div className="text-slate-500">
          📍 Model venue: <strong>MetLife Stadium</strong> (Lusail Generic Architecture)
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleLocalSimulation}
            className={`btn-secondary py-1 px-4 text-xs flex items-center gap-1.5 ${isDemoRunning ? 'border-sky-500 text-sky-400' : ''}`}
          >
            <RefreshCw size={12} className={isDemoRunning ? 'animate-spin' : ''} />
            {isDemoRunning ? 'Playing demo scenario' : 'Play demo scenario'}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StadiumApp />
    </AuthProvider>
  );
}

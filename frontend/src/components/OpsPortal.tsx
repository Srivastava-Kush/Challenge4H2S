import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, FileText, Send, CheckCircle, ClipboardList, HelpCircle, Activity, Users } from 'lucide-react';
import type { Node } from '../utils/routing';
import { OpsScorePanel } from './ops/OpsScorePanel';

const API_BASE = 'http://localhost:5000/api';

interface OpsQueueItem {
  gateId: string;
  name: string;
  queue: number;
  throughput: string;
  predictedWait: string;
  status: string;
}

interface IncidentItem {
  id: string;
  category: string;
  description: string;
  priority: string;
  location: string;
  assignedTo: string;
  status: string;
  timestamp: string;
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  mitigation: string;
  type: string;
  acknowledged: boolean;
  timestamp: string;
}

interface OpsPortalProps {
  queues: OpsQueueItem[];
  incidents: IncidentItem[];
  alerts: AlertItem[];
  onMitigateAlert: (alertId: string) => void;
  onReportIncident: (desc: string, loc: string) => void;
  onSendCopilotQuery: (query: string, callback: (ans: string, action: any) => void) => void;
  nodes: Node[];
  onUpdateIncident: (incidentId: string, status: string) => Promise<void>;
}

export const OpsPortal: React.FC<OpsPortalProps> = ({
  queues,
  incidents,
  alerts,
  onMitigateAlert,
  onReportIncident,
  onSendCopilotQuery,
  nodes,
  onUpdateIncident
}) => {
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotReply, setCopilotReply] = useState('');
  const [suggestedAction, setSuggestedAction] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  
  // Incident submission form state
  const [incDesc, setIncDesc] = useState('');
  const [incLoc, setIncLoc] = useState('corridor_south');

  // Fetch volunteers from DB
  useEffect(() => {
    const token = localStorage.getItem('stadiumiq_token');
    fetch(`${API_BASE}/volunteers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setVolunteers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [alerts, incidents]); // Re-fetch when alerts/incidents change (volunteer status may have changed)
  
  // Handover state
  const [handoverBrief, setHandoverBrief] = useState('');

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;
    onSendCopilotQuery(copilotInput, (ans, action) => {
      setCopilotReply(ans);
      setSuggestedAction(action);
    });
    setCopilotInput('');
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim()) return;
    onReportIncident(incDesc, incLoc);
    setIncDesc('');
  };

  const generateHandoverBriefing = () => {
    const time = new Date().toLocaleTimeString();
    const activeCount = incidents.filter(i => i.status === 'Active').length;
    const alertCount = alerts.filter(a => !a.acknowledged).length;

    const brief = `[FIFA WORLD CUP 2026 - SHIFT HANDOVER BRIEFING]
Generated: ${new Date().toLocaleDateString()} at ${time}
Current Status: Pre-match (Buildup phase)

1. ACTIVE ALERTS & GATE CONGESTION:
- Unresolved capacity warnings: ${alertCount} active alerts.
- Busiest Gate: Verizon Gate (Wait prediction: ${queues.find(q=>q.gateId==='gate_verizon')?.predictedWait || 'N/A'}).

2. SAFETY & INCIDENT LOGS:
- Active safety reports in triage: ${activeCount} incidents.
- Highlights: ${incidents.map(i => `[${i.priority} - ${i.category}] ${i.description}`).join('; ')}

3. RESOURCE ASSIGNMENTS:
- Volunter squads deployed: Volunteers Team A & B, Medical paramedic unit 2.
- Action items: Monitor Verizon Gate detour routing via Pepsi Gate / West Concourse.
`;
    setHandoverBrief(brief);
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
      {/* 0. Match Score Control */}
      <OpsScorePanel />

      {/* 0.5 Volunteer Status Panel */}
      <div className="glass-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Users size={16} className="text-violet-400" />
          Volunteer Dispatch Board
        </h2>
        {volunteers.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {volunteers.map(v => (
              <div key={v._id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${v.status === 'available' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'}`} />
                  <span className="font-semibold text-slate-200">{v.name}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="capitalize">{v.location?.replace(/_/g, ' ')}</span>
                  <span className={`badge ${v.status === 'available' ? 'badge-low' : 'badge-medium'} capitalize`}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-2 text-center">No volunteers registered in the system.</div>
        )}
      </div>

      {/* 1. Gate Queues Monitoring Card */}
      <div className="glass-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Activity size={16} className="text-emerald-500" />
          Gate Queues Telemetry
        </h2>
        <div className="overflow-x-auto">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Gate</th>
                <th>Queue</th>
                <th>Throughput</th>
                <th>Wait Estimate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queues.map(q => (
                <tr key={q.gateId}>
                  <td className="font-bold text-slate-200">{q.name}</td>
                  <td>{q.queue}</td>
                  <td>{q.throughput}</td>
                  <td className="text-sky-400 font-semibold">{q.predictedWait}</td>
                  <td>
                    <span className={`badge ${q.status === 'OK' ? 'badge-low' : 'badge-high'}`}>
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Operations Alert Center */}
      <div className="glass-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-rose-500" />
          Alert Control Room
        </h2>

        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-card ${alert.acknowledged ? 'acknowledged' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <AlertCircle size={14} className={alert.acknowledged ? 'text-emerald-500' : 'text-rose-500'} />
                  {alert.title}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">{alert.description}</p>
              
              {!alert.acknowledged ? (
                <div className="flex flex-col gap-3 bg-slate-950/40 p-2.5 rounded border border-rose-500/20">
                  <div className="text-[11px] text-rose-400 italic">
                    💡 Mitigate: {alert.mitigation}
                  </div>
                  <button 
                    onClick={() => onMitigateAlert(alert.id)}
                    className="btn-primary py-1.5 px-3 text-xs w-full justify-center"
                  >
                    Acknowledge & Activate Overflow
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 bg-slate-950/40 p-2 rounded border border-emerald-500/20">
                  <CheckCircle size={12} /> Mitigated: Detour routing applied. Incoming flow redirected.
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 py-2 text-center">
            No active operational warnings.
          </div>
        )}
      </div>

      {/* 3. Incident Triage Console */}
      <div className="glass-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <ClipboardList size={16} className="text-amber-500" />
          AI Incident Triage Console
        </h2>

        {/* Report safety issue form */}
        <form onSubmit={handleCreateReport} className="flex flex-col gap-2.5 mb-4 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Simulate Volunteer Safety Report</div>
          <input
            type="text"
            placeholder="e.g. Spilled beverage on Section 140 corridor"
            value={incDesc}
            onChange={(e) => setIncDesc(e.target.value)}
            className="chat-input py-2 text-xs"
          />
          <div className="flex gap-2">
            <select 
              value={incLoc} 
              onChange={(e) => setIncLoc(e.target.value)} 
              className="form-select m-0 py-1.5 text-xs flex-1"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
              <Send size={12} /> Route & Triage
            </button>
          </div>
        </form>

        {/* Incident List */}
        <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
          {incidents.map(inc => (
            <div key={inc.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className={`badge ${inc.priority === 'High' ? 'badge-high' : inc.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                  {inc.priority} Priority
                </span>
                <span className="text-[10px] text-slate-500">
                  {nodes.find(n => n.id === inc.location)?.name || inc.location}
                </span>
              </div>
              <p className="text-slate-200 text-xs font-medium">{inc.description}</p>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-800/60 pt-1.5">
                <span>Triage: <strong className="text-slate-300">{inc.category}</strong></span>
                <span>Assigned: <strong className="text-sky-400">{inc.assignedTo}</strong></span>
              </div>
              <div className="flex gap-1.5 mt-1">
                {['Acknowledged', 'In Progress', 'Resolved'].filter(status => status !== inc.status).map(status => (
                  <button key={status} onClick={() => onUpdateIncident(inc.id, status).catch(console.error)} className="btn-secondary py-1 px-2 text-[10px]">{status}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Operations Copilot Console */}
      <div className="glass-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <HelpCircle size={16} className="text-sky-500" />
          GenAI Operations Copilot
        </h2>
        <form onSubmit={handleCopilotSubmit} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Ask Copilot (e.g. 'which gates are over 80%?')"
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn">
            <Send size={14} />
          </button>
        </form>

        {copilotReply && (
          <div className="bg-sky-950/20 border border-sky-800/40 p-3 rounded-lg text-xs leading-normal">
            <p className="text-slate-200 mb-2">{copilotReply}</p>
            {suggestedAction && (
              <div className="bg-slate-950/50 p-2.5 rounded border border-rose-500/20 flex flex-col gap-2">
                <div className="text-[10px] font-bold text-rose-400">💡 RECOMMENDED MITIGATION:</div>
                <div className="text-[11px] text-slate-300">{suggestedAction.description}</div>
                <button 
                  onClick={() => {
                    onMitigateAlert(suggestedAction.alertId);
                    setSuggestedAction(null);
                  }}
                  className="btn-primary py-1 px-2 text-[10px] self-start"
                >
                  Deploy Mitigation Action
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Shift Handover briefing */}
      <div className="glass-panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <FileText size={16} className="text-slate-400" />
          Shift Handover Briefing
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Compiles active safety incidents, wait time peaks, and mitigation policies over the past shift.
        </p>
        <button 
          onClick={generateHandoverBriefing}
          className="btn-secondary w-full text-xs justify-center flex items-center gap-1.5"
        >
          <FileText size={14} /> Generate Handover Briefing
        </button>

        {handoverBrief && (
          <pre className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[10.5px] font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap mt-3">
            {handoverBrief}
          </pre>
        )}
      </div>
    </div>
  );
};

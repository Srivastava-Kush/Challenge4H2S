import { useCallback, useEffect, useState } from 'react';
import { ClipboardPlus, RefreshCw, Send } from 'lucide-react';
import type { Node } from '../utils/routing';

const API_BASE = 'http://localhost:5000/api';

interface VolunteerIncident {
  id: string;
  description: string;
  location: string;
  category: string;
  priority: string;
  status: 'Submitted' | 'Acknowledged' | 'In Progress' | 'Resolved';
  assignedTo: string;
  timestamp: string;
  resolutionNote?: string;
}

export function VolunteerPortal({ nodes }: { nodes: Node[] }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [incidents, setIncidents] = useState<VolunteerIncident[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('stadiumiq_token');

  useEffect(() => {
    if (!location && nodes[0]) setLocation(nodes[0].id);
  }, [location, nodes]);

  const loadIncidents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents/mine`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error('Unable to load your reports');
      setIncidents(await response.json());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load your reports');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadIncidents();
    const interval = window.setInterval(loadIncidents, 10_000);
    return () => window.clearInterval(interval);
  }, [loadIncidents]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ description, location }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit report');
      setDescription('');
      setMessage('Incident submitted to operations triage.');
      await loadIncidents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit report');
    }
  };

  return <section className="max-w-5xl mx-auto w-full overflow-y-auto py-8 px-4" aria-labelledby="volunteer-title">
    <div className="glass-panel mb-5"><p className="text-sky-400 text-xs font-bold tracking-widest">VOLUNTEER PORTAL</p><h2 id="volunteer-title" className="text-3xl font-bold mt-2">Report and track venue incidents</h2><p className="text-slate-400 mt-2">Each report is saved to operations triage. You can follow its status here.</p></div>
    <div className="grid lg:grid-cols-5 gap-5"><form onSubmit={submit} className="glass-panel lg:col-span-2 flex flex-col gap-3"><h3 className="font-bold flex items-center gap-2"><ClipboardPlus size={18} className="text-sky-400" /> New incident report</h3><textarea className="chat-input min-h-32" value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe what you observed, who may be affected, and any immediate safety concern." required /><select className="form-select m-0" value={location} onChange={event => setLocation(event.target.value)} required>{nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}</select><button type="submit" className="btn-primary justify-center flex items-center gap-2"><Send size={15} /> Submit to operations</button>{message && <p className="text-xs text-sky-300" role="status">{message}</p>}</form>
      <div className="glass-panel lg:col-span-3"><div className="flex justify-between items-center mb-3"><h3 className="font-bold">My reported incidents</h3><button onClick={loadIncidents} className="btn-secondary p-2" aria-label="Refresh reports"><RefreshCw size={14} /></button></div>{loading ? <p className="text-slate-500 text-sm">Loading reports…</p> : incidents.length === 0 ? <p className="text-slate-500 text-sm">You have not reported any incidents.</p> : <div className="flex flex-col gap-3">{incidents.map(incident => <article key={incident.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3"><div className="flex justify-between gap-3"><span className="font-semibold text-slate-100">{incident.category} · {incident.priority}</span><span className="badge badge-medium">{incident.status}</span></div><p className="text-sm text-slate-300 mt-2">{incident.description}</p><div className="text-xs text-slate-500 mt-2">Assigned to: {incident.assignedTo} · {new Date(incident.timestamp).toLocaleString()}</div>{incident.resolutionNote && <p className="text-xs text-emerald-400 mt-2">Resolution: {incident.resolutionNote}</p>}</article>)}</div>}</div></div>
  </section>;
}

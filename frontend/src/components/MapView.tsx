import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Node, Edge, CrowdData } from '../utils/routing';

interface MapViewProps {
  nodes: Node[];
  edges: Edge[];
  crowd: CrowdData;
  stadium: { name?: string; dimensions?: { width?: number; height?: number }; theme?: { background?: string } } | null;
  activeRoute: Node[] | null;
  startNodeId: string;
  destNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  nodes,
  edges,
  crowd,
  stadium,
  activeRoute,
  startNodeId,
  destNodeId,
  onSelectNode
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const getHeatColor = (density: number) => {
    if (density < 40) return '#10b981';
    if (density < 60) return '#d97706';
    if (density < 80) return '#ea580c';
    if (density < 90) return '#dc2626';
    return '#991b1b';
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getRouteDPath = () => {
    if (!activeRoute || activeRoute.length === 0) return '';
    return activeRoute.map((node, index) => {
      const prefix = index === 0 ? 'M' : 'L';
      return `${prefix} ${node.x} ${node.y}`;
    }).join(' ');
  };

  const getConcourseDensity = (corridorId: string) => crowd.nodes[corridorId]?.density ?? 0;
  const mapWidth = stadium?.dimensions?.width || 1200;
  const mapHeight = stadium?.dimensions?.height || 1200;

  return (
    <div
      className="map-viewport select-none"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={handleZoomIn} className="btn-secondary p-2 rounded-lg" title="Zoom In" aria-label="Zoom in map"><ZoomIn size={16} aria-hidden="true" /></button>
        <button onClick={handleZoomOut} className="btn-secondary p-2 rounded-lg" title="Zoom Out" aria-label="Zoom out map"><ZoomOut size={16} aria-hidden="true" /></button>
        <button onClick={handleReset} className="btn-secondary p-2 rounded-lg" title="Reset View" aria-label="Reset map view"><RotateCcw size={16} aria-hidden="true" /></button>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/40 border border-slate-700/50 p-4 rounded-xl text-xs flex flex-col gap-1.5 max-w-[240px] pointer-events-none backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
          <div className="font-bold text-slate-100 text-sm tracking-wide">{hoveredNode.name}</div>
          <div className="text-slate-300 capitalize font-medium">Type: {hoveredNode.type.replace('_', ' ')}</div>
          <div className="text-slate-400">Floor: {hoveredNode.level === 'ground' ? 'Ground' : `Level ${hoveredNode.level}`}</div>
          <div className="flex items-center gap-2 mt-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
            <span className="w-3 h-3 rounded-full inline-block shadow-[0_0_8px_currentColor]" style={{ backgroundColor: getHeatColor(crowd.nodes[hoveredNode.id]?.density || 0), color: getHeatColor(crowd.nodes[hoveredNode.id]?.density || 0) }} />
            <span className="font-bold text-slate-200">
              Crowd: {crowd.nodes[hoveredNode.id]?.density || 0}% ({crowd.nodes[hoveredNode.id]?.status || 'Low'})
            </span>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="map-svg"
        role="group"
        aria-label="Interactive stadium map. Use Tab to move between locations, Enter or Space to select."
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'none'
        }}
      >
        {/* Background */}
        <rect width={mapWidth} height={mapHeight} fill={stadium?.theme?.background || '#060913'} />

        {/* Ring guides */}
        <circle cx="600" cy="600" r="490" fill="none" stroke="#1e293b" strokeWidth="3" strokeDasharray="10, 5" opacity="0.3" />
        <circle cx="600" cy="600" r="390" fill="none" stroke="#1e293b" strokeWidth="2" opacity="0.4" />
        <circle cx="600" cy="600" r="260" fill="none" stroke="#334155" strokeWidth="1" opacity="0.5" />
        <circle cx="600" cy="600" r="180" fill="none" stroke="#1e293b" strokeWidth="2" opacity="0.4" />

        {/* Pitch */}
        <g transform="translate(600, 600)">
          <rect x="-100" y="-70" width="200" height="140" fill="#1b4332" stroke="#ffffff" strokeWidth="2" rx="4" opacity="0.8" />
          <line x1="0" y1="-70" x2="0" y2="70" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="25" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="-100" y="-35" width="25" height="70" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="75" y="-35" width="25" height="70" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* Concourse heat arcs */}
        <g>
          <path d="M 416 416 A 260 260 0 0 1 784 416" fill="none" stroke={getHeatColor(getConcourseDensity('corridor_north'))} strokeWidth="50" opacity="0.35" className="concourse-path" />
          <path d="M 784 416 A 260 260 0 0 1 784 784" fill="none" stroke={getHeatColor(getConcourseDensity('corridor_east'))} strokeWidth="50" opacity="0.35" className="concourse-path" />
          <path d="M 784 784 A 260 260 0 0 1 416 784" fill="none" stroke={getHeatColor(getConcourseDensity('corridor_south'))} strokeWidth="50" opacity="0.35" className="concourse-path" />
          <path d="M 416 784 A 260 260 0 0 1 416 416" fill="none" stroke={getHeatColor(getConcourseDensity('corridor_west'))} strokeWidth="50" opacity="0.35" className="concourse-path" />
        </g>

        {/* Concourse density % labels */}
        <g fill="#ffffff" fontFamily="'Outfit', sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle">
          <rect x="575" y="325" width="50" height="30" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="600" y="345" fill="#f8fafc">{getConcourseDensity('corridor_north')}%</text>
          <rect x="835" y="585" width="50" height="30" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="860" y="605" fill="#f8fafc">{getConcourseDensity('corridor_east')}%</text>
          <rect x="575" y="845" width="50" height="30" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="600" y="865" fill="#f8fafc">{getConcourseDensity('corridor_south')}%</text>
          <rect x="315" y="585" width="50" height="30" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="340" y="605" fill="#f8fafc">{getConcourseDensity('corridor_west')}%</text>
        </g>

        {/* Edge network */}
        <g opacity="0.3">
          {edges.map((edge, idx) => {
            const nf = nodes.find(n => n.id === edge.from);
            const nt = nodes.find(n => n.id === edge.to);
            if (!nf || !nt) return null;
            return (
              <line key={`edge-${idx}`} x1={nf.x} y1={nf.y} x2={nt.x} y2={nt.y} stroke="#64748b" strokeWidth="3" strokeDasharray="6, 6" />
            );
          })}
        </g>

        {/* Active route path */}
        {activeRoute && activeRoute.length > 0 && (
          <>
            {/* Glow backing path */}
            <path d={getRouteDPath()} fill="none" stroke="rgba(14,165,233,0.4)" strokeWidth="20" strokeLinecap="round" style={{ filter: 'blur(8px)' }} />
            <path d={getRouteDPath()} fill="none" stroke="rgba(14,165,233,0.8)" strokeWidth="8" strokeLinecap="round" className="animate-pulse" />
            <path d={getRouteDPath()} className="route-path" fill="none" />
          </>
        )}

        {/* Nodes */}
        <g>
          {nodes.map(node => {
            const isStart = node.id === startNodeId;
            const isDest = node.id === destNodeId;
            const isGate = node.type === 'gate';
            const size = isStart || isDest ? (isGate ? 18 : 14) : (isGate ? 15 : 10);

            let color = '#475569';
            if (node.type === 'gate')     color = '#38bdf8';
            else if (node.type === 'restroom') color = '#a855f7';
            else if (node.type === 'food')     color = '#eab308';
            else if (node.type === 'medical')  color = '#ef4444';
            else if (node.type === 'prayer')   color = '#10b981';
            else if (node.type === 'lift')     color = '#ec4899';
            else if (node.type === 'section')  color = '#f97316';

            const strokeColor = isStart ? '#ffffff' : (isDest ? '#0ea5e9' : '#0f172a');
            const strokeWidth = isStart || isDest ? 4 : 2;

            return (
              <g
                key={node.id}
                className={`map-node ${isStart ? 'active start' : ''} ${isDest ? 'active dest' : ''}`}
                onClick={() => onSelectNode(node.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectNode(node.id); } }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onFocus={() => setHoveredNode(node)}
                onBlur={() => setHoveredNode(null)}
                role="button"
                tabIndex={0}
                aria-label={`${node.name}, ${node.type}, ${node.level === 'ground' ? 'ground floor' : `level ${node.level}`}. Crowd density: ${crowd.nodes[node.id]?.density ?? 0}%.${isStart ? ' Currently selected as your start.' : ''}${isDest ? ' Currently selected as your destination.' : ''}`}
                aria-pressed={isStart || isDest}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {/* Pulsing ring for start/dest */}
                {(isStart || isDest) && (
                  <>
                    <circle cx={node.x} cy={node.y} r={size + 10} fill="none" stroke={isStart ? '#ffffff' : '#0ea5e9'} strokeWidth="1" opacity="0.25" className="animate-pulse" />
                    <circle cx={node.x} cy={node.y} r={size + 6} fill="none" stroke={isStart ? '#ffffff' : '#0ea5e9'} strokeWidth="1.5" opacity="0.5" className="animate-pulse" />
                  </>
                )}

                {/* Core circle */}
                <circle cx={node.x} cy={node.y} r={size} fill={color} stroke={strokeColor} strokeWidth={strokeWidth} style={{ color }} />

                {/* Gate letter label */}
                {isGate && (
                  <text x={node.x} y={node.y + 4} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    {node.name.replace(' Gate', '').charAt(0)}
                  </text>
                )}

                {/* "YOU ARE HERE" label on start node */}
                {isStart && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={node.x - 42}
                      y={node.y - 50}
                      width="84"
                      height="18"
                      rx="5"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text x={node.x} y={node.y - 37} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                      📍 YOU ARE HERE
                    </text>
                  </g>
                )}

                {/* Destination pin */}
                {isDest && (
                  <g transform={`translate(${node.x - 10}, ${node.y - 30}) scale(0.8)`} style={{ pointerEvents: 'none' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#0ea5e9" />
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Floor level legend overlay on map */}
        <g>
          <rect x="20" y="20" width="140" height="90" rx="8" fill="rgba(8,11,17,0.85)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="90" y="40" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="1">FLOOR LEVELS</text>
          {[
            { color: '#475569', label: 'Ground (Gates)' },
            { color: '#38bdf8', label: 'Level 1 (100s)' },
            { color: '#f97316', label: 'Level 2 (200s)' },
            { color: '#a855f7', label: 'Level 3 (300s)' },
          ].map((item, i) => (
            <g key={i}>
              <circle cx="34" cy={55 + i * 16} r="4" fill={item.color} />
              <text x="44" y={59 + i * 16} fill="#94a3b8" fontSize="9" fontFamily="'Outfit',sans-serif">{item.label}</text>
            </g>
          ))}
        </g>
      </svg>

      {/* Crowd legend */}
      <div className="absolute bottom-4 right-4 bg-slate-950/80 border border-slate-800/80 p-3 rounded-lg text-[10px] flex flex-col gap-1.5 backdrop-blur-sm pointer-events-auto">
        <div className="font-bold text-slate-400 uppercase tracking-wide">Crowd Capacity</div>
        <div className="grid grid-cols-5 gap-2 text-center text-slate-300">
          {[
            { color: '#10b981', label: '0-39%' },
            { color: '#d97706', label: '40-59%' },
            { color: '#ea580c', label: '60-79%' },
            { color: '#dc2626', label: '80-89%' },
            { color: '#991b1b', label: '90%+' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center">
              <span className="w-4 h-2 rounded mb-1" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

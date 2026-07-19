import GraphNode from '../models/GraphNode.js';
import GraphEdge from '../models/GraphEdge.js';
import CrowdTelemetry from '../models/CrowdTelemetry.js';
import Stadium from '../models/Stadium.js';

const emptyCrowd = () => ({ timestamp: new Date().toISOString(), nodes: {}, edges: {} });

export function normalizeNode(node) {
  const source = node?.toObject ? node.toObject() : node;
  return {
    ...source,
    id: source.nodeId ?? source.id,
    x: source.x ?? source.coordinates?.x ?? 0,
    y: source.y ?? source.coordinates?.y ?? 0,
    accessible: source.accessible ?? source.isAccessible ?? true,
  };
}

export function normalizeEdge(edge) {
  const source = edge?.toObject ? edge.toObject() : edge;
  return {
    ...source,
    id: source.edgeId ?? source.id,
    from: source.from ?? source.source,
    to: source.to ?? source.target,
    walkTime: source.walkTime ?? Math.max(1, Math.round((source.distance ?? 0) / 1.2)),
    accessible: source.accessible ?? source.isAccessible ?? true,
    stairs: source.stairs ?? false,
  };
}

export function normalizeCrowd(crowd) {
  if (!crowd) return emptyCrowd();
  const source = crowd?.toObject ? crowd.toObject() : crowd;
  return {
    timestamp: source.timestamp ? new Date(source.timestamp).toISOString() : new Date().toISOString(),
    nodes: Object.fromEntries(Object.entries(source.nodes ?? {})),
    edges: Object.fromEntries(Object.entries(source.edges ?? {})),
  };
}

export async function getMapData() {
  const [nodes, edges, crowd, stadium] = await Promise.all([
    GraphNode.find().lean(),
    GraphEdge.find().lean(),
    CrowdTelemetry.findOne().sort({ updatedAt: -1, _id: -1 }).lean(),
    Stadium.findOne().lean(),
  ]);

  return {
    stadium,
    nodes: nodes.map(normalizeNode).filter(node => Boolean(node.id)),
    edges: edges.map(normalizeEdge).filter(edge => Boolean(edge.from && edge.to)),
    crowd: normalizeCrowd(crowd),
  };
}

export async function getNavigationData() {
  const { nodes, edges, crowd } = await getMapData();
  return { nodes, edges, crowd };
}

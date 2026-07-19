export interface Node {
  id: string;
  name: string;
  type: string;
  level: string;
  x: number;
  y: number;
  accessible: boolean;
}

export interface Edge {
  from: string;
  to: string;
  distance: number;
  walkTime: number; // in seconds
  accessible: boolean;
  stairs: boolean;
  blocked?: boolean;
}

export interface CrowdNodeDetail {
  density: number;
  status: string;
}

export interface CrowdEdgeDetail {
  density: number;
}

export interface CrowdData {
  timestamp: string;
  nodes: Record<string, CrowdNodeDetail>;
  edges: Record<string, CrowdEdgeDetail>;
}

export interface RouteResult {
  path: Node[];
  edges: Edge[];
  totalDistance: number;
  totalTime: number; // in seconds
  routeAdjusted: boolean;
}

/**
 * Helper to retrieve crowd density for an edge.
 * Handles both key ordering (e.g. from_to or to_from).
 */
export function getEdgeDensity(fromId: string, toId: string, crowd: CrowdData): number {
  if (!crowd?.edges) return 0;
  const key1 = `${fromId}_${toId}`;
  const key2 = `${toId}_${fromId}`;
  if (crowd.edges[key1] !== undefined) {
    return crowd.edges[key1].density;
  }
  if (crowd.edges[key2] !== undefined) {
    return crowd.edges[key2].density;
  }
  return 0;
}

/**
 * Calculates edge weight multiplier based on crowd density:
 * - < 40: 1.0x
 * - 40-59: 1.5x
 * - 60-79: 3.0x
 * - >= 80: 8.0x
 */
export function getCrowdMultiplier(density: number): number {
  if (density < 40) return 1.0;
  if (density < 60) return 1.5;
  if (density < 80) return 3.0;
  return 8.0;
}

/**
 * Dijkstra's algorithm for finding the shortest path in the stadium graph.
 */
export function findRoute(
  startId: string,
  endId: string,
  nodes: Node[],
  edges: Edge[],
  crowd: CrowdData,
  accessibilityMode: boolean
): RouteResult | null {
  const nodeMap = new Map<string, Node>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  if (!nodeMap.has(startId) || !nodeMap.has(endId)) {
    return null;
  }

  // Build adjacency list. Since stadium walkways are bidirectional, add both directions.
  const adj = new Map<string, Array<{ to: string; edge: Edge }>>();
  nodes.forEach(n => adj.set(n.id, []));

  edges.forEach(edge => {
    // If accessibility mode is ON, filter out stairs or inaccessible edges.
    if (accessibilityMode) {
      if (edge.stairs || !edge.accessible) {
        return; // Skip this edge entirely
      }
    }
    
    // If the edge is marked blocked, skip it
    if (edge.blocked) {
      return;
    }

    if (adj.has(edge.from)) {
      adj.get(edge.from)!.push({ to: edge.to, edge });
    }
    if (adj.has(edge.to)) {
      adj.get(edge.to)!.push({ to: edge.from, edge });
    }
  });

  const distances = new Map<string, number>();
  const times = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: Edge } | null>();
  const visited = new Set<string>();

  nodes.forEach(n => {
    distances.set(n.id, Infinity);
    times.set(n.id, Infinity);
    previous.set(n.id, null);
  });

  distances.set(startId, 0);
  times.set(startId, 0);

  let routeAdjusted = false;

  while (visited.size < nodes.length) {
    // Find unvisited node with minimum distance
    let u: string | null = null;
    let minDistance = Infinity;

    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        const d = distances.get(n.id)!;
        if (d < minDistance) {
          minDistance = d;
          u = n.id;
        }
      }
    });

    if (u === null || minDistance === Infinity) {
      break;
    }

    if (u === endId) {
      break;
    }

    visited.add(u);

    const neighbors = adj.get(u) || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      if (visited.has(v)) continue;

      const edge = neighbor.edge;
      const density = getEdgeDensity(u, v, crowd);
      const mult = getCrowdMultiplier(density);

      if (mult > 1.0) {
        routeAdjusted = true;
      }

      // Calculate path cost: distance * crowdMultiplier
      const cost = edge.distance * mult;
      const totalTimeCost = times.get(u)! + ((edge.walkTime || 0) * mult);

      const altCost = distances.get(u)! + cost;

      if (altCost < distances.get(v)!) {
        distances.set(v, altCost);
        // Note: we track actual physical distance and actual time separately for reporting
        times.set(v, totalTimeCost);
        previous.set(v, { nodeId: u, edge });
      }
    }
  }

  if (distances.get(endId) === Infinity) {
    return null; // No route found
  }

  // Reconstruct path
  const path: Node[] = [];
  const routeEdges: Edge[] = [];
  let curr: string | null = endId;

  while (curr !== null) {
    const node = nodeMap.get(curr);
    if (node) {
      path.unshift(node);
    }
    const prevInfo = previous.get(curr);
    if (prevInfo) {
      routeEdges.unshift(prevInfo.edge);
      curr = prevInfo.nodeId;
    } else {
      curr = null;
    }
  }

  // Sum up physical properties
  let totalDistance = 0;
  let totalTime = 0;
  routeEdges.forEach(e => {
    totalDistance += e.distance;
    const density = getEdgeDensity(e.from, e.to, crowd);
    const mult = getCrowdMultiplier(density);
    totalTime += (e.walkTime || 0) * mult;
  });

  return {
    path,
    edges: routeEdges,
    totalDistance,
    totalTime,
    routeAdjusted
  };
}

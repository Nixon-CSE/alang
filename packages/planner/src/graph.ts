import type { GraphNode } from "./types.js";
import type { RoleId } from "./roles.js";

// ---------------------------------------------------------------------------
// Cycle detection
// ---------------------------------------------------------------------------

type VisitState = "unvisited" | "in-progress" | "done";

/**
 * Performs a depth-first traversal to detect cycles.
 * Returns the cycle path as a string if one is found, or null otherwise.
 */
function detectCycleDfs(
  nodeId: RoleId,
  adjacency: Map<RoleId, RoleId[]>,
  state: Map<RoleId, VisitState>,
  stack: RoleId[],
): string | null {
  state.set(nodeId, "in-progress");
  stack.push(nodeId);

  for (const dep of adjacency.get(nodeId) ?? []) {
    if (state.get(dep) === "in-progress") {
      // Found a back-edge: reconstruct the cycle path.
      const cycleStart = stack.indexOf(dep);
      return [...stack.slice(cycleStart), dep].join(" → ");
    }
    if (state.get(dep) === "unvisited") {
      const cycle = detectCycleDfs(dep, adjacency, state, stack);
      if (cycle !== null) return cycle;
    }
  }

  stack.pop();
  state.set(nodeId, "done");
  return null;
}

// ---------------------------------------------------------------------------
// Public validation
// ---------------------------------------------------------------------------

export interface GraphValidationResult {
  valid: boolean;
  /** Human-readable error messages, one per violation. */
  errors: string[];
}

/**
 * Validates the structural integrity of a set of graph nodes.
 *
 * Checks:
 * 1. Every dependency ID references a node that exists in the list.
 * 2. The dependency graph contains no cycles.
 */
export function validateGraph(nodes: GraphNode[]): GraphValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjacency = new Map<RoleId, RoleId[]>(
    nodes.map((n) => [n.id, n.dependsOn]),
  );

  // --- Pass 1: dangling dependency references ---
  for (const node of nodes) {
    for (const dep of node.dependsOn) {
      if (!nodeIds.has(dep)) {
        errors.push(
          `Node '${node.id}' depends on '${dep}', which does not exist in the graph.`,
        );
      }
    }
  }

  // --- Pass 2: cycle detection (only if references are clean) ---
  if (errors.length === 0) {
    const state = new Map<RoleId, VisitState>(
      nodes.map((n) => [n.id, "unvisited"]),
    );

    for (const node of nodes) {
      if (state.get(node.id) === "unvisited") {
        const cycle = detectCycleDfs(node.id, adjacency, state, []);
        if (cycle !== null) {
          errors.push(`Cycle detected in execution graph: ${cycle}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

import type { RoleId } from "./roles.js";

/**
 * A single node in the execution graph.
 *
 * Each node represents one engineering role and declares which
 * other nodes must complete before this one can start.
 */
export interface GraphNode {
  /** Stable, unique identifier for this node (matches RoleId). */
  id: RoleId;
  /** Machine-readable role name. */
  role: RoleId;
  /** Human-readable job title. */
  title: string;
  /** Scope of work for this role in the context of the project. */
  description: string;
  /**
   * IDs of nodes that must finish before this node may begin.
   * An empty array means the node is a root (no dependencies).
   */
  dependsOn: RoleId[];
}

/**
 * The fully-resolved planning output.
 *
 * Nodes are stored in topological order: a node always appears
 * after all of its dependencies, making serial execution trivial.
 */
export interface ExecutionGraph {
  /** Name of the project being planned. */
  project: string;
  /** All nodes, in topological (dependency) order. */
  nodes: GraphNode[];
}

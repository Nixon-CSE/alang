/**
 * @alang/planner
 *
 * Converts a validated ALang project into a deterministic engineering
 * execution graph (DAG).  Pure planning engine — no networking, no
 * filesystem access, no AI calls.
 */

export { plan } from "./planner.js";
export { validateGraph } from "./graph.js";
export { buildTasks } from "./tasks.js";
export { ROLE_CATALOG } from "./roles.js";
export type { RoleId, RoleDefinition } from "./roles.js";
export type { GraphNode, ExecutionGraph } from "./types.js";

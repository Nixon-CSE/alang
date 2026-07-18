import type { AlangAst } from "@alang/parser";
import { ROLE_CATALOG, type RoleId } from "./roles.js";
import type { GraphNode } from "./types.js";

/**
 * Describes one tier of the execution pipeline.
 *
 * All roles within a tier run in parallel; a tier only starts
 * after every role in the previous tier has completed.
 */
interface Tier {
  roles: RoleId[];
}

/**
 * The canonical dependency pipeline for any ALang project.
 *
 * Tier order is fixed regardless of the specific technology stack,
 * ensuring deterministic graph output for identical inputs.
 *
 * Tier 0 – CEO         : set vision & constraints
 * Tier 1 – Architect   : design system before anyone codes
 * Tier 2 – Backend / Frontend / Security : parallel implementation
 * Tier 3 – QA          : validate everything in tier 2
 * Tier 4 – Docs        : document the stabilised system
 * Tier 5 – DevOps      : ship and operate
 */
const BASE_PIPELINE: Tier[] = [
  { roles: ["ceo"] },
  { roles: ["architect"] },
  { roles: ["backend", "frontend", "security"] },
  { roles: ["qa"] },
  { roles: ["documentation"] },
  { roles: ["devops"] },
];

/**
 * Selects which roles are actually needed for the given AST.
 *
 * Rules:
 * - CEO and Architect are always included.
 * - Backend is included when a backend is declared.
 * - Frontend is included when a frontend is declared.
 * - Security is always included (auth, CVE scanning, etc.).
 * - QA is always included.
 * - Documentation is always included.
 * - DevOps is included when a deployment target is declared.
 */
function selectRoles(ast: AlangAst): Set<RoleId> {
  const active = new Set<RoleId>(["ceo", "architect", "security", "qa", "documentation"]);

  if (ast.stack.backend !== undefined) active.add("backend");
  if (ast.stack.frontend !== undefined) active.add("frontend");
  if (ast.deployment !== undefined) active.add("devops");

  return active;
}

/**
 * Builds the ordered list of GraphNodes from the pipeline tiers.
 *
 * Each node's `dependsOn` is the union of all roles in the
 * immediately preceding tier that are also active.
 */
export function buildTasks(ast: AlangAst): GraphNode[] {
  const activeRoles = selectRoles(ast);
  const nodes: GraphNode[] = [];

  /** Roles that were emitted in the previous tier (the "gate"). */
  let previousTierRoles: RoleId[] = [];

  for (const tier of BASE_PIPELINE) {
    const tierRoles = tier.roles.filter((role) => activeRoles.has(role));

    // Skip tiers that have no active roles (e.g. DevOps without deployment).
    if (tierRoles.length === 0) continue;

    for (const roleId of tierRoles) {
      const def = ROLE_CATALOG[roleId];
      nodes.push({
        id: def.id,
        role: def.id,
        title: def.title,
        description: def.description,
        dependsOn: [...previousTierRoles],
      });
    }

    previousTierRoles = tierRoles;
  }

  return nodes;
}

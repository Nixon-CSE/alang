import type { AlangAst } from "@alang/parser";
import type { SemanticResult } from "@alang/semantic";
import { buildTasks } from "./tasks.js";
import { validateGraph } from "./graph.js";
import type { ExecutionGraph } from "./types.js";

/**
 * Converts a validated ALang project into a deterministic execution graph.
 *
 * @param ast            - The parsed ALang AST produced by @alang/parser.
 * @param semanticResult - The output of the semantic analyser; planning is
 *                         refused if the project has semantic errors.
 *
 * @returns An ExecutionGraph whose nodes are in topological order.
 *
 * @throws {Error} If `semanticResult` contains semantic errors, or if the
 *                 generated graph fails its own structural validation.
 *
 * @example
 * ```ts
 * import { parse }    from "@alang/parser";
 * import { analyze }  from "@alang/semantic";
 * import { plan }     from "@alang/planner";
 *
 * const ast      = parse(source);
 * const semantic = analyze(ast);
 * const graph    = plan(ast, semantic);
 * ```
 */
export function plan(ast: AlangAst, semanticResult: SemanticResult): ExecutionGraph {
  // Refuse to plan projects that did not pass semantic analysis.
  if (!semanticResult.valid) {
    const summary = semanticResult.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => `  [${d.code}] ${d.message}`)
      .join("\n");

    throw new Error(
      `Cannot plan a project with semantic errors:\n${summary}`,
    );
  }

  const nodes = buildTasks(ast);

  // Validate that the generated graph is structurally sound.
  const validation = validateGraph(nodes);
  if (!validation.valid) {
    throw new Error(
      `Planner produced an invalid graph:\n${validation.errors.join("\n")}`,
    );
  }

  return { project: ast.project, nodes };
}

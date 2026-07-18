import type { AlangAst } from "./ast.js";
import { AlangError } from "./errors.js";
import { TOP_LEVEL_KEYWORDS } from "./keywords.js";

export function validate(ast: AlangAst): void {
  if (!ast.project.trim()) {
    throw new AlangError("Project name cannot be empty.");
  }

  if (ast.description !== undefined && ast.description.trim() === "") {
    throw new AlangError("Description cannot be an empty string.");
  }

  for (const [keyword, value] of Object.entries(ast.stack)) {
    if (value !== undefined && value.trim() === "") {
      throw new AlangError(`'${keyword}' value cannot be empty.`);
    }
  }

  if (ast.deployment !== undefined && ast.deployment.trim() === "") {
    throw new AlangError("'deployment' value cannot be empty.");
  }

  if (ast.auth !== undefined && ast.auth.trim() === "") {
    throw new AlangError("'auth' value cannot be empty.");
  }

  const seenAgents = new Set<string>();

  for (const agent of ast.agents) {
    if (agent.trim() === "") {
      throw new AlangError("Agent names cannot be empty.");
    }

    const normalized = agent.toLowerCase();

    if (seenAgents.has(normalized)) {
      throw new AlangError(`Duplicate agent '${agent}'.`);
    }

    seenAgents.add(normalized);
  }

  const hasStackValue = Object.values(ast.stack).some(
    (value) => value !== undefined,
  );

  if (!hasStackValue && ast.agents.length === 0) {
    throw new AlangError(
      `Add at least one stack field (${TOP_LEVEL_KEYWORDS.frontend}, ${TOP_LEVEL_KEYWORDS.backend}, ${TOP_LEVEL_KEYWORDS.database}) or an agents block.`,
    );
  }
}

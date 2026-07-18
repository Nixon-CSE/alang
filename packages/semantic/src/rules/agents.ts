import { error, findCatalogMatch, formatCatalogSuggestions } from "../diagnostics.js";
import type { SemanticRule } from "../types.js";

export const SUPPORTED_AGENTS = [
  "architect",
  "backend",
  "frontend",
  "qa",
  "devops",
  "security",
] as const;

export const agentsRule: SemanticRule = (ast) => {
  const diagnostics = [];

  for (const agent of ast.agents) {
    if (findCatalogMatch(agent, SUPPORTED_AGENTS) === undefined) {
      diagnostics.push(
        error(
          "UNKNOWN_AGENT",
          `Unknown agent '${agent}'.`,
          `Supported agents: ${formatCatalogSuggestions(SUPPORTED_AGENTS)}.`,
        ),
      );
    }
  }

  return diagnostics;
};

export function getSupportedAgent(value: string): string | undefined {
  return findCatalogMatch(value, SUPPORTED_AGENTS);
}

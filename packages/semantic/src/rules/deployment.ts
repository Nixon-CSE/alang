import {
  error,
  findCatalogMatch,
  formatCatalogSuggestions,
} from "../diagnostics.js";
import type { SemanticRule } from "../types.js";

export const SUPPORTED_DEPLOYMENTS = [
  "Railway",
  "Vercel",
  "AWS",
  "Fly.io",
  "Render",
  "Netlify",
] as const;

export const deploymentRule: SemanticRule = (ast) => {
  if (ast.deployment === undefined) {
    return [];
  }

  if (findCatalogMatch(ast.deployment, SUPPORTED_DEPLOYMENTS) !== undefined) {
    return [];
  }

  return [
    error(
      "UNSUPPORTED_DEPLOYMENT",
      `Unsupported deployment target '${ast.deployment}'.`,
      `Supported deployment targets: ${formatCatalogSuggestions(SUPPORTED_DEPLOYMENTS)}.`,
    ),
  ];
};

export function getSupportedDeployment(
  value: string | undefined,
): string | undefined {
  return value === undefined
    ? undefined
    : findCatalogMatch(value, SUPPORTED_DEPLOYMENTS);
}

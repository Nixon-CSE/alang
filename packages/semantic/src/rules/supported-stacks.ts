import type { AlangAst } from "@alang/parser";
import {
  error,
  findCatalogMatch,
  formatCatalogSuggestions,
} from "../diagnostics.js";
import type { SemanticRule } from "../types.js";

export const SUPPORTED_FRONTENDS = [
  "React",
  "Vue",
  "Angular",
  "Svelte",
  "Next.js",
] as const;

export const SUPPORTED_BACKENDS = [
  "FastAPI",
  "Express",
  "Django",
  "Rails",
  "NestJS",
] as const;

export const SUPPORTED_DATABASES = [
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "SQLite",
  "Redis",
] as const;

export const supportedStacksRule: SemanticRule = (ast) => {
  const diagnostics = [];

  if (
    ast.stack.frontend !== undefined &&
    findCatalogMatch(ast.stack.frontend, SUPPORTED_FRONTENDS) === undefined
  ) {
    diagnostics.push(
      error(
        "UNSUPPORTED_FRONTEND",
        `Unsupported frontend '${ast.stack.frontend}'.`,
        `Supported frontends: ${formatCatalogSuggestions(SUPPORTED_FRONTENDS)}.`,
      ),
    );
  }

  if (
    ast.stack.backend !== undefined &&
    findCatalogMatch(ast.stack.backend, SUPPORTED_BACKENDS) === undefined
  ) {
    diagnostics.push(
      error(
        "UNSUPPORTED_BACKEND",
        `Unsupported backend '${ast.stack.backend}'.`,
        `Supported backends: ${formatCatalogSuggestions(SUPPORTED_BACKENDS)}.`,
      ),
    );
  }

  if (
    ast.stack.database !== undefined &&
    findCatalogMatch(ast.stack.database, SUPPORTED_DATABASES) === undefined
  ) {
    diagnostics.push(
      error(
        "UNSUPPORTED_DATABASE",
        `Unsupported database '${ast.stack.database}'.`,
        `Supported databases: ${formatCatalogSuggestions(SUPPORTED_DATABASES)}.`,
      ),
    );
  }

  return diagnostics;
};

export function getSupportedFrontend(value: string | undefined): string | undefined {
  return value === undefined
    ? undefined
    : findCatalogMatch(value, SUPPORTED_FRONTENDS);
}

export function getSupportedBackend(value: string | undefined): string | undefined {
  return value === undefined
    ? undefined
    : findCatalogMatch(value, SUPPORTED_BACKENDS);
}

export function getSupportedDatabase(value: string | undefined): string | undefined {
  return value === undefined
    ? undefined
    : findCatalogMatch(value, SUPPORTED_DATABASES);
}

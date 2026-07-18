import type { Diagnostic, DiagnosticSeverity } from "./types.js";

export function createDiagnostic(
  severity: DiagnosticSeverity,
  code: string,
  message: string,
  suggestion?: string,
): Diagnostic {
  return suggestion === undefined
    ? { severity, code, message }
    : { severity, code, message, suggestion };
}

export function error(
  code: string,
  message: string,
  suggestion?: string,
): Diagnostic {
  return createDiagnostic("error", code, message, suggestion);
}

export function warning(
  code: string,
  message: string,
  suggestion?: string,
): Diagnostic {
  return createDiagnostic("warning", code, message, suggestion);
}

export function info(
  code: string,
  message: string,
  suggestion?: string,
): Diagnostic {
  return createDiagnostic("info", code, message, suggestion);
}

export function formatCatalogSuggestions(entries: readonly string[]): string {
  return entries.join(", ");
}

export function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

export function findCatalogMatch(
  value: string | undefined,
  catalog: readonly string[],
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeValue(value);
  return catalog.find((entry) => normalizeValue(entry) === normalized);
}

export function isValidCatalogValue(
  value: string | undefined,
  catalog: readonly string[],
): boolean {
  if (value === undefined) {
    return false;
  }

  return findCatalogMatch(value, catalog) !== undefined;
}

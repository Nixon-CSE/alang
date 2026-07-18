import type { AlangAst } from "@alang/parser";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  suggestion?: string;
}

export interface SemanticResult {
  valid: boolean;
  diagnostics: Diagnostic[];
  ast: AlangAst;
}

export type SemanticRule = (ast: AlangAst) => Diagnostic[];

export interface CatalogEntry {
  id: string;
  label: string;
}

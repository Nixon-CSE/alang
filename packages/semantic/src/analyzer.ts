import type { AlangAst } from "@alang/parser";
import { semanticRules } from "./rules/index.js";
import type { Diagnostic, SemanticResult, SemanticRule } from "./types.js";

export function runSemanticRules(
  ast: AlangAst,
  rules: SemanticRule[] = semanticRules,
): Diagnostic[] {
  return rules.flatMap((rule) => rule(ast));
}

export function analyze(ast: AlangAst): SemanticResult {
  const diagnostics = runSemanticRules(ast);

  return {
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    diagnostics,
    ast,
  };
}

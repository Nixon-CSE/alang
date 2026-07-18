import type { AlangAst } from "@alang/parser";
import { error } from "../diagnostics.js";
import type { SemanticRule } from "../types.js";

export const requiredFieldsRule: SemanticRule = (ast) => {
  const diagnostics = [];

  if (ast.stack.frontend === undefined) {
    diagnostics.push(
      error(
        "REQUIRED_FRONTEND",
        "Missing required stack field 'frontend'.",
        "Add a frontend declaration such as: frontend React",
      ),
    );
  }

  if (ast.stack.backend === undefined) {
    diagnostics.push(
      error(
        "REQUIRED_BACKEND",
        "Missing required stack field 'backend'.",
        "Add a backend declaration such as: backend FastAPI",
      ),
    );
  }

  if (ast.stack.database === undefined) {
    diagnostics.push(
      error(
        "REQUIRED_DATABASE",
        "Missing required stack field 'database'.",
        "Add a database declaration such as: database PostgreSQL",
      ),
    );
  }

  return diagnostics;
};

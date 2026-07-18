import { info, normalizeValue, warning } from "../diagnostics.js";
import type { SemanticRule } from "../types.js";
import { getSupportedAgent } from "./agents.js";
import { getSupportedDeployment } from "./deployment.js";
import {
  getSupportedBackend,
  getSupportedDatabase,
  getSupportedFrontend,
} from "./supported-stacks.js";

const EPHEMERAL_DEPLOYMENTS = ["Railway", "Render", "Fly.io", "Vercel"] as const;

const SERVERLESS_DEPLOYMENTS = ["Vercel", "Netlify"] as const;

const TRADITIONAL_BACKENDS = ["Django", "Rails", "Express"] as const;

export const compatibilityRule: SemanticRule = (ast) => {
  const diagnostics = [];

  const frontend = getSupportedFrontend(ast.stack.frontend);
  const backend = getSupportedBackend(ast.stack.backend);
  const database = getSupportedDatabase(ast.stack.database);
  const deployment = getSupportedDeployment(ast.deployment);

  if (database === "SQLite" && deployment !== undefined) {
    const ephemeral = EPHEMERAL_DEPLOYMENTS.find(
      (target) => normalizeValue(target) === normalizeValue(deployment),
    );

    if (ephemeral !== undefined) {
      diagnostics.push(
        warning(
          "INCOMPATIBLE_SQLITE_EPHEMERAL",
          `SQLite is not recommended with ${ephemeral} because the filesystem is ephemeral.`,
          "Use PostgreSQL or MySQL for production deployments on ephemeral platforms.",
        ),
      );
    }
  }

  if (deployment !== undefined && backend !== undefined) {
    const serverless = SERVERLESS_DEPLOYMENTS.find(
      (target) => normalizeValue(target) === normalizeValue(deployment),
    );
    const traditional = TRADITIONAL_BACKENDS.find(
      (framework) => normalizeValue(framework) === normalizeValue(backend),
    );

    if (serverless !== undefined && traditional !== undefined) {
      diagnostics.push(
        warning(
          "INCOMPATIBLE_SERVERLESS_BACKEND",
          `${traditional} is difficult to run on ${serverless}, which favors frontend and serverless functions.`,
          `Consider FastAPI or NestJS for ${serverless}, or deploy ${traditional} on Railway or Render.`,
        ),
      );
    }
  }

  if (frontend === "Next.js" && backend === "Rails") {
    diagnostics.push(
      info(
        "STACK_NEXTJS_RAILS",
        "Next.js with Rails is supported, but API boundaries should be defined explicitly.",
        "Use Rails as an API-only backend or keep rendering responsibilities in Next.js.",
      ),
    );
  }

  if (frontend === "Angular" && backend === "FastAPI") {
    diagnostics.push(
      info(
        "STACK_ANGULAR_FASTAPI",
        "Angular with FastAPI is a common SPA plus API setup.",
        "Configure CORS and an API base URL for local and deployed environments.",
      ),
    );
  }

  if (ast.agents.length > 0) {
    const hasBackendAgent = ast.agents.some(
      (agent) => getSupportedAgent(agent) === "backend",
    );
    const hasFrontendAgent = ast.agents.some(
      (agent) => getSupportedAgent(agent) === "frontend",
    );

    if (backend !== undefined && !hasBackendAgent) {
      diagnostics.push(
        info(
          "AGENT_MISSING_BACKEND",
          "A backend framework is configured, but no backend agent is assigned.",
          "Add a backend agent to cover API and server-side implementation.",
        ),
      );
    }

    if (frontend !== undefined && !hasFrontendAgent) {
      diagnostics.push(
        info(
          "AGENT_MISSING_FRONTEND",
          "A frontend framework is configured, but no frontend agent is assigned.",
          "Add a frontend agent to cover UI implementation.",
        ),
      );
    }
  }

  return diagnostics;
};

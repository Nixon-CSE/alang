export { analyze, runSemanticRules } from "./analyzer.js";
export {
  error,
  info,
  warning,
  createDiagnostic,
  findCatalogMatch,
  formatCatalogSuggestions,
  isValidCatalogValue,
  normalizeValue,
} from "./diagnostics.js";
export {
  agentsRule,
  compatibilityRule,
  deploymentRule,
  requiredFieldsRule,
  semanticRules,
  supportedStacksRule,
} from "./rules/index.js";
export {
  SUPPORTED_AGENTS,
  getSupportedAgent,
} from "./rules/agents.js";
export {
  SUPPORTED_DEPLOYMENTS,
  getSupportedDeployment,
} from "./rules/deployment.js";
export {
  SUPPORTED_BACKENDS,
  SUPPORTED_DATABASES,
  SUPPORTED_FRONTENDS,
  getSupportedBackend,
  getSupportedDatabase,
  getSupportedFrontend,
} from "./rules/supported-stacks.js";
export type {
  CatalogEntry,
  Diagnostic,
  DiagnosticSeverity,
  SemanticResult,
  SemanticRule,
} from "./types.js";

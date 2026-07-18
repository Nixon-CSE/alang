import { agentsRule } from "./agents.js";
import { compatibilityRule } from "./compatibility.js";
import { deploymentRule } from "./deployment.js";
import { requiredFieldsRule } from "./required-fields.js";
import { supportedStacksRule } from "./supported-stacks.js";
import type { SemanticRule } from "../types.js";

export const semanticRules: SemanticRule[] = [
  requiredFieldsRule,
  supportedStacksRule,
  deploymentRule,
  agentsRule,
  compatibilityRule,
];

export {
  agentsRule,
  compatibilityRule,
  deploymentRule,
  requiredFieldsRule,
  supportedStacksRule,
};

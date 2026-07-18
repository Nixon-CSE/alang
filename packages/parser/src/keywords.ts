export const TOP_LEVEL_KEYWORDS = {
  project: "project",
  description: "description",
  frontend: "frontend",
  backend: "backend",
  database: "database",
  deployment: "deployment",
  auth: "auth",
  agents: "agents",
} as const;

export type TopLevelKeyword =
  (typeof TOP_LEVEL_KEYWORDS)[keyof typeof TOP_LEVEL_KEYWORDS];

export const STACK_KEYWORDS = [
  TOP_LEVEL_KEYWORDS.frontend,
  TOP_LEVEL_KEYWORDS.backend,
  TOP_LEVEL_KEYWORDS.database,
] as const;

export type StackKeyword = (typeof STACK_KEYWORDS)[number];

export const TOP_LEVEL_VALUE_KEYWORDS = [
  TOP_LEVEL_KEYWORDS.description,
  TOP_LEVEL_KEYWORDS.frontend,
  TOP_LEVEL_KEYWORDS.backend,
  TOP_LEVEL_KEYWORDS.database,
  TOP_LEVEL_KEYWORDS.deployment,
  TOP_LEVEL_KEYWORDS.auth,
] as const;

export type TopLevelValueKeyword =
  (typeof TOP_LEVEL_VALUE_KEYWORDS)[number];

const TOP_LEVEL_KEYWORD_SET = new Set<string>(Object.values(TOP_LEVEL_KEYWORDS));

export function isTopLevelKeyword(value: string): value is TopLevelKeyword {
  return TOP_LEVEL_KEYWORD_SET.has(value);
}

export function isStackKeyword(value: string): value is StackKeyword {
  return (
    value === TOP_LEVEL_KEYWORDS.frontend ||
    value === TOP_LEVEL_KEYWORDS.backend ||
    value === TOP_LEVEL_KEYWORDS.database
  );
}

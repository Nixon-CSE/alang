/**
 * Canonical set of engineering roles the planner can assign.
 *
 * Order matters: it controls the default dependency chain.
 * Roles that share the same tier run in parallel.
 */

export type RoleId =
  | "ceo"
  | "architect"
  | "backend"
  | "frontend"
  | "security"
  | "qa"
  | "documentation"
  | "devops";

export interface RoleDefinition {
  /** Stable, machine-readable identifier. */
  readonly id: RoleId;
  /** Human-readable job title. */
  readonly title: string;
  /**
   * Describes the scope of work this role performs.
   * Used as the node description in the execution graph.
   */
  readonly description: string;
}

/**
 * Master catalog of every role the planner knows about.
 * Keyed by RoleId for O(1) lookup.
 */
export const ROLE_CATALOG: Record<RoleId, RoleDefinition> = {
  ceo: {
    id: "ceo",
    title: "CEO",
    description:
      "Defines product vision, sets success criteria, and aligns the engineering plan with business objectives.",
  },
  architect: {
    id: "architect",
    title: "Architect",
    description:
      "Designs the system architecture, chooses the technology stack, and establishes cross-cutting standards.",
  },
  backend: {
    id: "backend",
    title: "Backend Engineer",
    description:
      "Implements server-side logic, REST/GraphQL APIs, data models, and business rules.",
  },
  frontend: {
    id: "frontend",
    title: "Frontend Engineer",
    description:
      "Builds the user interface, client-side state management, and accessibility compliance.",
  },
  security: {
    id: "security",
    title: "Security Engineer",
    description:
      "Performs threat modelling, hardens authentication/authorisation flows, and audits dependencies for CVEs.",
  },
  qa: {
    id: "qa",
    title: "QA Engineer",
    description:
      "Designs and executes test plans covering unit, integration, end-to-end, and performance scenarios.",
  },
  documentation: {
    id: "documentation",
    title: "Documentation Engineer",
    description:
      "Produces API references, developer guides, architecture decision records (ADRs), and onboarding material.",
  },
  devops: {
    id: "devops",
    title: "DevOps Engineer",
    description:
      "Configures CI/CD pipelines, infrastructure-as-code, monitoring, and production deployment.",
  },
} as const;

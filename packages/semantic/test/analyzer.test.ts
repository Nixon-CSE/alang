import type { AlangAst } from "@alang/parser";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyze, runSemanticRules } from "../src/analyzer.js";
import {
  agentsRule,
  compatibilityRule,
  deploymentRule,
  requiredFieldsRule,
  supportedStacksRule,
} from "../src/rules/index.js";

function createAst(overrides: Partial<AlangAst> = {}): AlangAst {
  return {
    project: "Ecommerce",
    description: "Example",
    stack: {
      frontend: "React",
      backend: "FastAPI",
      database: "PostgreSQL",
    },
    deployment: "Railway",
    auth: "Clerk",
    agents: ["architect", "backend", "frontend", "qa"],
    ...overrides,
  };
}

function codes(result: ReturnType<typeof analyze>): string[] {
  return result.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("analyze", () => {
  it("returns valid for a fully supported ALang configuration", () => {
    const result = analyze(createAst());

    assert.equal(result.valid, true);
    assert.equal(result.diagnostics.length, 0);
    assert.equal(result.ast.project, "Ecommerce");
  });

  it("accepts stack and deployment values case-insensitively", () => {
    const result = analyze(
      createAst({
        stack: {
          frontend: "react",
          backend: "fastapi",
          database: "postgresql",
        },
        deployment: "railway",
      }),
    );

    assert.equal(result.valid, true);
    assert.equal(result.diagnostics.length, 0);
  });

  it("reports missing required stack fields", () => {
    const result = analyze(
      createAst({
        stack: {},
        agents: ["qa"],
      }),
    );

    assert.equal(result.valid, false);
    assert.deepEqual(codes(result), [
      "REQUIRED_FRONTEND",
      "REQUIRED_BACKEND",
      "REQUIRED_DATABASE",
    ]);
    assert.match(
      result.diagnostics[0]!.message,
      /Missing required stack field 'frontend'/,
    );
    assert.ok(result.diagnostics[0]!.suggestion?.includes("frontend React"));
  });

  it("reports unsupported stack values with suggestions", () => {
    const result = analyze(
      createAst({
        stack: {
          frontend: "Ember",
          backend: "Laravel",
          database: "CouchDB",
        },
      }),
    );

    assert.equal(result.valid, false);
    assert.deepEqual(codes(result), [
      "UNSUPPORTED_FRONTEND",
      "UNSUPPORTED_BACKEND",
      "UNSUPPORTED_DATABASE",
    ]);
    assert.match(result.diagnostics[0]!.suggestion!, /React, Vue, Angular/);
  });

  it("reports unsupported deployment targets", () => {
    const result = analyze(
      createAst({
        deployment: "Heroku",
      }),
    );

    assert.equal(result.valid, false);
    assert.deepEqual(codes(result), ["UNSUPPORTED_DEPLOYMENT"]);
    assert.match(result.diagnostics[0]!.suggestion!, /Railway, Vercel, AWS/);
  });

  it("allows missing deployment targets", () => {
    const result = analyze(
      createAst({
        deployment: undefined,
      }),
    );

    assert.equal(result.valid, true);
    assert.equal(result.diagnostics.length, 0);
  });

  it("reports unknown agents", () => {
    const result = analyze(
      createAst({
        agents: ["architect", "designer", "qa"],
      }),
    );

    assert.equal(result.valid, false);
    assert.deepEqual(codes(result), ["UNKNOWN_AGENT"]);
    assert.match(result.diagnostics[0]!.message, /Unknown agent 'designer'/);
  });

  it("warns about SQLite on ephemeral deployment platforms", () => {
    const result = analyze(
      createAst({
        stack: {
          frontend: "React",
          backend: "FastAPI",
          database: "SQLite",
        },
        deployment: "Railway",
      }),
    );

    assert.equal(result.valid, true);
    assert.deepEqual(codes(result), ["INCOMPATIBLE_SQLITE_EPHEMERAL"]);
    assert.equal(result.diagnostics[0]!.severity, "warning");
  });

  it("warns about traditional backends on serverless deployment targets", () => {
    const result = analyze(
      createAst({
        stack: {
          frontend: "React",
          backend: "Django",
          database: "PostgreSQL",
        },
        deployment: "Vercel",
      }),
    );

    assert.equal(result.valid, true);
    assert.deepEqual(codes(result), ["INCOMPATIBLE_SERVERLESS_BACKEND"]);
    assert.equal(result.diagnostics[0]!.severity, "warning");
  });

  it("emits informational diagnostics for agent coverage gaps", () => {
    const result = analyze(
      createAst({
        agents: ["architect", "qa"],
      }),
    );

    assert.equal(result.valid, true);
    assert.deepEqual(codes(result), [
      "AGENT_MISSING_BACKEND",
      "AGENT_MISSING_FRONTEND",
    ]);
    assert.ok(
      result.diagnostics.every((diagnostic) => diagnostic.severity === "info"),
    );
  });

  it("runs custom rule sets without modifying the analyzer core", () => {
    const diagnostics = runSemanticRules(createAst({ deployment: "Heroku" }), [
      deploymentRule,
    ]);

    assert.deepEqual(
      diagnostics.map((diagnostic) => diagnostic.code),
      ["UNSUPPORTED_DEPLOYMENT"],
    );
  });
});

describe("semantic rules", () => {
  it("requiredFieldsRule only validates stack completeness", () => {
    const diagnostics = requiredFieldsRule(
      createAst({
        stack: { frontend: "React" },
      }),
    );

    assert.deepEqual(
      diagnostics.map((diagnostic) => diagnostic.code),
      ["REQUIRED_BACKEND", "REQUIRED_DATABASE"],
    );
  });

  it("supportedStacksRule ignores undefined stack values", () => {
    const diagnostics = supportedStacksRule(
      createAst({
        stack: {
          frontend: "React",
        },
      }),
    );

    assert.equal(diagnostics.length, 0);
  });

  it("agentsRule accepts supported agent names case-insensitively", () => {
    const diagnostics = agentsRule(
      createAst({
        agents: ["Architect", "QA", "DevOps"],
      }),
    );

    assert.equal(diagnostics.length, 0);
  });

  it("compatibilityRule emits guidance for Next.js and Rails", () => {
    const diagnostics = compatibilityRule(
      createAst({
        stack: {
          frontend: "Next.js",
          backend: "Rails",
          database: "PostgreSQL",
        },
      }),
    );

    assert.deepEqual(
      diagnostics.map((diagnostic) => diagnostic.code),
      ["STACK_NEXTJS_RAILS"],
    );
  });
});

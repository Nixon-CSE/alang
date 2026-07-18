import type { AlangAst } from "@alang/parser";
import type { SemanticResult } from "@alang/semantic";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plan } from "../src/planner.js";
import { buildTasks } from "../src/tasks.js";
import { validateGraph } from "../src/graph.js";
import type { GraphNode } from "../src/types.js";
import type { RoleId } from "../src/roles.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Full-featured AST (all stacks + deployment). */
function fullAst(overrides: Partial<AlangAst> = {}): AlangAst {
  return {
    project: "Ecommerce",
    description: "A full-stack e-commerce platform",
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

/** Wraps an AST in a passing SemanticResult. */
function validSemantic(ast: AlangAst): SemanticResult {
  return { valid: true, diagnostics: [], ast };
}

/** Wraps an AST in a failing SemanticResult. */
function invalidSemantic(ast: AlangAst): SemanticResult {
  return {
    valid: false,
    diagnostics: [
      {
        severity: "error",
        code: "REQUIRED_BACKEND",
        message: "Missing required stack field 'backend'.",
        suggestion: "Add: backend FastAPI",
      },
    ],
    ast,
  };
}

/** Returns the IDs of all nodes, in order. */
function ids(nodes: GraphNode[]): RoleId[] {
  return nodes.map((n) => n.id);
}

/** Returns the dependsOn list for a specific role. */
function depsOf(nodes: GraphNode[], role: RoleId): RoleId[] {
  return nodes.find((n) => n.id === role)?.dependsOn ?? [];
}

// ---------------------------------------------------------------------------
// plan()
// ---------------------------------------------------------------------------

describe("plan()", () => {
  it("returns an ExecutionGraph for a valid project", () => {
    const ast = fullAst();
    const graph = plan(ast, validSemantic(ast));

    assert.equal(graph.project, "Ecommerce");
    assert.ok(graph.nodes.length > 0, "graph must contain at least one node");
  });

  it("always starts with CEO and ends with DevOps when deployment is present", () => {
    const ast = fullAst();
    const graph = plan(ast, validSemantic(ast));
    const nodeIds = ids(graph.nodes);

    assert.equal(nodeIds[0], "ceo");
    assert.equal(nodeIds[nodeIds.length - 1], "devops");
  });

  it("throws when the semantic result is invalid", () => {
    const ast = fullAst();
    assert.throws(
      () => plan(ast, invalidSemantic(ast)),
      /Cannot plan a project with semantic errors/,
    );
  });

  it("produces deterministic output for identical inputs", () => {
    const ast = fullAst();
    const semantic = validSemantic(ast);

    const graphA = plan(ast, semantic);
    const graphB = plan(ast, semantic);

    assert.deepEqual(ids(graphA.nodes), ids(graphB.nodes));
    assert.deepEqual(
      graphA.nodes.map((n) => n.dependsOn),
      graphB.nodes.map((n) => n.dependsOn),
    );
  });
});

// ---------------------------------------------------------------------------
// Graph shape — full stack + deployment
// ---------------------------------------------------------------------------

describe("execution graph — full stack", () => {
  it("contains all expected roles", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    const nodeIds = ids(nodes);

    const expected: RoleId[] = [
      "ceo",
      "architect",
      "backend",
      "frontend",
      "security",
      "qa",
      "documentation",
      "devops",
    ];

    for (const role of expected) {
      assert.ok(nodeIds.includes(role), `expected role '${role}' in graph`);
    }
  });

  it("CEO has no dependencies (root node)", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    assert.deepEqual(depsOf(nodes, "ceo"), []);
  });

  it("Architect depends only on CEO", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    assert.deepEqual(depsOf(nodes, "architect"), ["ceo"]);
  });

  it("Backend, Frontend and Security are parallel (all depend on Architect only)", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));

    assert.deepEqual(depsOf(nodes, "backend"), ["architect"]);
    assert.deepEqual(depsOf(nodes, "frontend"), ["architect"]);
    assert.deepEqual(depsOf(nodes, "security"), ["architect"]);
  });

  it("QA depends on the parallel implementation tier (Backend, Frontend, Security)", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    const qaDeps = depsOf(nodes, "qa");

    assert.ok(qaDeps.includes("backend"), "QA must depend on backend");
    assert.ok(qaDeps.includes("frontend"), "QA must depend on frontend");
    assert.ok(qaDeps.includes("security"), "QA must depend on security");
  });

  it("Documentation depends on QA", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    assert.deepEqual(depsOf(nodes, "documentation"), ["qa"]);
  });

  it("DevOps depends on Documentation", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    assert.deepEqual(depsOf(nodes, "devops"), ["documentation"]);
  });

  it("nodes are in topological order (no node precedes its dependencies)", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));

    const position = new Map(nodes.map((n, i) => [n.id, i]));

    for (const node of nodes) {
      for (const dep of node.dependsOn) {
        const depIndex = position.get(dep) ?? Infinity;
        const nodeIndex = position.get(node.id) ?? -Infinity;
        assert.ok(
          depIndex < nodeIndex,
          `dependency '${dep}' must appear before '${node.id}'`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Graph shape — partial stacks
// ---------------------------------------------------------------------------

describe("execution graph — partial stacks", () => {
  it("omits Frontend when no frontend is declared in the AST", () => {
    const ast = fullAst({ stack: { backend: "FastAPI", database: "PostgreSQL" } });
    const { nodes } = plan(ast, validSemantic(ast));
    const nodeIds = ids(nodes);

    assert.ok(!nodeIds.includes("frontend"), "frontend must be absent");
    assert.ok(nodeIds.includes("backend"), "backend must still be present");
  });

  it("omits Backend when no backend is declared in the AST", () => {
    const ast = fullAst({ stack: { frontend: "React", database: "PostgreSQL" } });
    const { nodes } = plan(ast, validSemantic(ast));
    const nodeIds = ids(nodes);

    assert.ok(!nodeIds.includes("backend"), "backend must be absent");
    assert.ok(nodeIds.includes("frontend"), "frontend must still be present");
  });

  it("omits DevOps when no deployment is declared", () => {
    const ast = fullAst({ deployment: undefined });
    const { nodes } = plan(ast, validSemantic(ast));

    assert.ok(!ids(nodes).includes("devops"), "devops must be absent without deployment");
  });

  it("QA still depends on whatever implementation roles are present", () => {
    // Only backend — no frontend.
    const ast = fullAst({
      stack: { backend: "FastAPI", database: "PostgreSQL" },
      deployment: undefined,
    });
    const { nodes } = plan(ast, validSemantic(ast));
    const qaDeps = depsOf(nodes, "qa");

    assert.ok(qaDeps.includes("backend"), "QA must depend on backend");
    assert.ok(qaDeps.includes("security"), "QA must depend on security");
    assert.ok(!qaDeps.includes("frontend"), "QA must not depend on absent frontend");
  });
});

// ---------------------------------------------------------------------------
// Node shape
// ---------------------------------------------------------------------------

describe("graph node structure", () => {
  it("each node has id, role, title, description, and dependsOn", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));

    for (const node of nodes) {
      assert.ok(typeof node.id === "string", "id must be a string");
      assert.ok(typeof node.role === "string", "role must be a string");
      assert.ok(typeof node.title === "string", "title must be a string");
      assert.ok(node.title.length > 0, "title must be non-empty");
      assert.ok(typeof node.description === "string", "description must be a string");
      assert.ok(node.description.length > 0, "description must be non-empty");
      assert.ok(Array.isArray(node.dependsOn), "dependsOn must be an array");
    }
  });

  it("id and role are always equal", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));

    for (const node of nodes) {
      assert.equal(node.id, node.role, "id and role must be identical");
    }
  });

  it("CEO node has expected title", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    const ceo = nodes.find((n) => n.id === "ceo");

    assert.ok(ceo !== undefined, "CEO node must exist");
    assert.equal(ceo.title, "CEO");
  });
});

// ---------------------------------------------------------------------------
// validateGraph()
// ---------------------------------------------------------------------------

describe("validateGraph()", () => {
  it("returns valid for a well-formed graph", () => {
    const ast = fullAst();
    const { nodes } = plan(ast, validSemantic(ast));
    const result = validateGraph(nodes);

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it("detects a dangling dependency reference", () => {
    const nodes: GraphNode[] = [
      {
        id: "ceo",
        role: "ceo",
        title: "CEO",
        description: "...",
        dependsOn: ["architect"], // architect is not in the list
      },
    ];

    const result = validateGraph(nodes);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("architect")));
  });

  it("detects a direct cycle between two nodes", () => {
    const nodes: GraphNode[] = [
      { id: "ceo", role: "ceo", title: "CEO", description: "...", dependsOn: ["architect"] },
      { id: "architect", role: "architect", title: "Architect", description: "...", dependsOn: ["ceo"] },
    ];

    const result = validateGraph(nodes);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.toLowerCase().includes("cycle")));
  });

  it("detects a multi-hop cycle", () => {
    const nodes: GraphNode[] = [
      { id: "ceo", role: "ceo", title: "CEO", description: "...", dependsOn: ["devops"] },
      { id: "architect", role: "architect", title: "Architect", description: "...", dependsOn: ["ceo"] },
      { id: "devops", role: "devops", title: "DevOps Engineer", description: "...", dependsOn: ["architect"] },
    ];

    const result = validateGraph(nodes);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.toLowerCase().includes("cycle")));
  });

  it("accepts a single root node with no dependencies", () => {
    const nodes: GraphNode[] = [
      { id: "ceo", role: "ceo", title: "CEO", description: "...", dependsOn: [] },
    ];

    const result = validateGraph(nodes);

    assert.equal(result.valid, true);
  });
});

// ---------------------------------------------------------------------------
// buildTasks()
// ---------------------------------------------------------------------------

describe("buildTasks()", () => {
  it("returns an array with at least CEO and Architect", () => {
    const nodes = buildTasks(fullAst());
    const nodeIds = ids(nodes);

    assert.ok(nodeIds.includes("ceo"));
    assert.ok(nodeIds.includes("architect"));
  });

  it("does not include duplicate nodes", () => {
    const nodes = buildTasks(fullAst());
    const nodeIds = ids(nodes);
    const unique = new Set(nodeIds);

    assert.equal(nodeIds.length, unique.size, "each role must appear exactly once");
  });
});

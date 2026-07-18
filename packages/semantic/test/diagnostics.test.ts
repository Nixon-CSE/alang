import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDiagnostic,
  error,
  findCatalogMatch,
  info,
  normalizeValue,
  warning,
} from "../src/diagnostics.js";

describe("diagnostics", () => {
  it("creates diagnostics with optional suggestions", () => {
    const diagnostic = createDiagnostic(
      "warning",
      "TEST_CODE",
      "Something looks off.",
      "Try this instead.",
    );

    assert.deepEqual(diagnostic, {
      severity: "warning",
      code: "TEST_CODE",
      message: "Something looks off.",
      suggestion: "Try this instead.",
    });
  });

  it("omits suggestion when not provided", () => {
    assert.deepEqual(error("ERR", "Failed."), {
      severity: "error",
      code: "ERR",
      message: "Failed.",
    });
  });

  it("normalizes catalog values case-insensitively", () => {
    assert.equal(normalizeValue(" FastAPI "), "fastapi");
    assert.equal(findCatalogMatch("react", ["React", "Vue"]), "React");
  });

  it("exposes severity helpers", () => {
    assert.equal(warning("W", "warn").severity, "warning");
    assert.equal(info("I", "info").severity, "info");
  });
});

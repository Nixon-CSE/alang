import type { SourceLocation } from "./ast.js";

export class AlangError extends Error {
  readonly location?: SourceLocation;

  constructor(message: string, location?: SourceLocation) {
    const formatted = location
      ? `${message} (line ${location.line}, column ${location.column})`
      : message;

    super(formatted);
    this.name = "AlangError";
    this.location = location;
  }
}

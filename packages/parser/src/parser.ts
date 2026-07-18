import type { AlangAst } from "./ast.js";
import { AlangError } from "./errors.js";
import { TOP_LEVEL_KEYWORDS, type StackKeyword } from "./keywords.js";
import { lex, TokenType, type Token } from "./lexer.js";

export function parseTokens(tokens: Token[]): AlangAst {
  const parser = new Parser(tokens);
  return parser.parseDocument();
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parseDocument(): AlangAst {
    const ast: AlangAst = {
      project: "",
      stack: {},
      agents: [],
    };

    this.skipLeadingNewlines();
    ast.project = this.parseProjectDeclaration();
    this.skipBlankLines();

    while (!this.check(TokenType.Eof)) {
      this.parseTopLevelDeclaration(ast);
      this.skipBlankLines();
    }

    return ast;
  }

  private parseProjectDeclaration(): string {
    this.consumeKeyword(
      TOP_LEVEL_KEYWORDS.project,
      'Expected a project declaration. Start the file with: project <name>',
    );

    const name = this.parseName(
      "Expected a project name after 'project'.",
    );

    this.consumeOptionalNewline();
    return name;
  }

  private parseTopLevelDeclaration(ast: AlangAst): void {
    const token = this.peek();

    if (token.type === TokenType.Identifier) {
      throw this.error(`Unknown keyword '${token.value}'.`, token);
    }

    if (token.type !== TokenType.Keyword) {
      throw this.error(
        `Unexpected token '${this.tokenLabel(token)}'. Expected a top-level declaration such as description, frontend, or agents.`,
        token,
      );
    }

    switch (token.value) {
      case TOP_LEVEL_KEYWORDS.description:
        this.parseDescription(ast);
        return;
      case TOP_LEVEL_KEYWORDS.frontend:
      case TOP_LEVEL_KEYWORDS.backend:
      case TOP_LEVEL_KEYWORDS.database:
        this.parseStackDeclaration(ast, token.value as StackKeyword);
        return;
      case TOP_LEVEL_KEYWORDS.deployment:
        this.parseDeploymentDeclaration(ast);
        return;
      case TOP_LEVEL_KEYWORDS.auth:
        this.parseAuthDeclaration(ast);
        return;
      case TOP_LEVEL_KEYWORDS.agents:
        this.parseAgentsDeclaration(ast);
        return;
      case TOP_LEVEL_KEYWORDS.project:
        throw this.error(
          "Duplicate 'project' declaration. Project can only be declared once.",
          token,
        );
      default:
        throw this.error(`Unknown keyword '${token.value}'.`, token);
    }
  }

  private parseDescription(ast: AlangAst): void {
    this.advance();

    if (ast.description !== undefined) {
      throw this.error("Duplicate 'description' declaration.", this.previous());
    }

    const token = this.peek();

    if (token.type !== TokenType.String) {
      throw this.error(
        "Expected a quoted string after 'description'. Example: description \"Example\"",
        token,
      );
    }

    ast.description = this.advance().value;
    this.consumeOptionalNewline();
  }

  private parseStackDeclaration(ast: AlangAst, keyword: StackKeyword): void {
    this.advance();

    if (ast.stack[keyword] !== undefined) {
      throw this.error(`Duplicate '${keyword}' declaration.`, this.previous());
    }

    ast.stack[keyword] = this.parseName(
      `Expected a value after '${keyword}'. Example: ${keyword} React`,
    );

    this.consumeOptionalNewline();
  }

  private parseDeploymentDeclaration(ast: AlangAst): void {
    this.advance();

    if (ast.deployment !== undefined) {
      throw this.error("Duplicate 'deployment' declaration.", this.previous());
    }

    ast.deployment = this.parseName(
      "Expected a value after 'deployment'. Example: deployment Railway",
    );

    this.consumeOptionalNewline();
  }

  private parseAuthDeclaration(ast: AlangAst): void {
    this.advance();

    if (ast.auth !== undefined) {
      throw this.error("Duplicate 'auth' declaration.", this.previous());
    }

    ast.auth = this.parseName(
      "Expected a value after 'auth'. Example: auth Clerk",
    );

    this.consumeOptionalNewline();
  }

  private parseAgentsDeclaration(ast: AlangAst): void {
    this.advance();

    if (ast.agents.length > 0) {
      throw this.error("Duplicate 'agents' declaration.", this.previous());
    }

    this.consumeNewline();

    if (!this.match(TokenType.Indent)) {
      throw this.error(
        "Expected an indented list of agents after 'agents'.",
        this.peek(),
      );
    }

    while (this.match(TokenType.Identifier)) {
      ast.agents.push(this.previous().value);
      this.consumeOptionalNewline();
    }

    if (ast.agents.length === 0) {
      throw this.error(
        "The 'agents' block must include at least one agent.",
        this.peek(),
      );
    }

    if (this.match(TokenType.Dedent)) {
      return;
    }

    if (this.check(TokenType.Eof)) {
      return;
    }

    throw this.error(
      "Unexpected token inside 'agents' block. Each agent must be an identifier on its own indented line.",
      this.peek(),
    );
  }

  private parseName(message: string): string {
    const token = this.peek();

    if (token.type === TokenType.Identifier || token.type === TokenType.String) {
      return this.advance().value;
    }

    throw this.error(message, token);
  }

  private consumeKeyword(keyword: string, message: string): void {
    const token = this.peek();

    if (token.type === TokenType.Keyword && token.value === keyword) {
      this.advance();
      return;
    }

    throw this.error(message, token);
  }

  private consumeNewline(): void {
    if (this.match(TokenType.Newline)) {
      return;
    }

    throw this.error("Expected a new line.", this.peek());
  }

  private consumeOptionalNewline(): void {
    while (this.match(TokenType.Newline)) {
      // Keep consuming blank-line separators.
    }
  }

  private skipLeadingNewlines(): void {
    while (this.match(TokenType.Newline)) {
      // Skip file-leading blank lines.
    }
  }

  private skipBlankLines(): void {
    while (this.match(TokenType.Newline)) {
      // Skip blank lines between declarations.
    }
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }

    return false;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private peek(): Token {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1]!;
  }

  private advance(): Token {
    const token = this.peek();

    if (token.type !== TokenType.Eof) {
      this.index += 1;
    }

    return token;
  }

  private previous(): Token {
    return this.tokens[this.index - 1] ?? this.peek();
  }

  private tokenLabel(token: Token): string {
    if (token.type === TokenType.Newline) {
      return "newline";
    }

    if (token.type === TokenType.Eof) {
      return "end of file";
    }

    return token.value;
  }

  private error(message: string, token: Token): AlangError {
    return new AlangError(message, {
      line: token.line,
      column: token.column,
    });
  }
}

export function parseSource(source: string): AlangAst {
  return parseTokens(lex(source));
}

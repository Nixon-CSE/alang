import { AlangError } from "./errors.js";
import { isTopLevelKeyword } from "./keywords.js";

export enum TokenType {
  Identifier = "Identifier",
  String = "String",
  Keyword = "Keyword",
  Newline = "Newline",
  Indent = "Indent",
  Dedent = "Dedent",
  Eof = "Eof",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const INDENT_WIDTH = 2;

export function lex(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}

class Lexer {
  private readonly tokens: Token[] = [];
  private readonly indentStack = [0];
  private pos = 0;
  private line = 1;
  private column = 1;
  private atLineStart = true;

  constructor(private readonly source: string) {}

  tokenize(): Token[] {
    while (this.pos < this.source.length) {
      if (this.atLineStart) {
        this.handleLineStart();
        continue;
      }

      this.skipInlineWhitespace();

      if (this.pos >= this.source.length || this.peek() === "\n") {
        if (this.peek() === "\n") {
          this.advance("\n");
          this.tokens.push(this.makeToken(TokenType.Newline, "\\n"));
          this.atLineStart = true;
        }
        continue;
      }

      const char = this.peek();

      if (char === "#") {
        this.skipLineComment();
        continue;
      }

      if (char === '"') {
        this.tokens.push(this.readString());
        continue;
      }

      if (this.isIdentifierStart(char)) {
        this.tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      throw this.error(`Unexpected character '${char}'.`);
    }

    this.emitDeduentsToRoot();
    this.tokens.push(this.makeToken(TokenType.Eof, ""));

    return this.tokens;
  }

  private handleLineStart(): void {
    const indent = this.readIndentation();
    const currentIndent = this.indentStack[this.indentStack.length - 1]!;

    if (indent > currentIndent) {
      this.indentStack.push(indent);
      this.tokens.push(this.makeToken(TokenType.Indent, ""));
    } else if (indent < currentIndent) {
      while (
        this.indentStack.length > 1 &&
        this.indentStack[this.indentStack.length - 1]! > indent
      ) {
        this.indentStack.pop();
        this.tokens.push(this.makeToken(TokenType.Dedent, ""));
      }

      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        throw this.error("Inconsistent indentation.");
      }
    }

    if (this.isBlankLine()) {
      this.skipToNextLine();
      return;
    }

    this.atLineStart = false;
  }

  private readIndentation(): number {
    let indent = 0;

    while (this.pos < this.source.length) {
      const char = this.peek();

      if (char === " ") {
        indent += 1;
        this.advance(char);
        continue;
      }

      if (char === "\t") {
        throw this.error(
          "Tabs are not supported for indentation. Use spaces instead.",
        );
      }

      break;
    }

    if (indent % INDENT_WIDTH !== 0) {
      throw this.error(
        `Indentation must use multiples of ${INDENT_WIDTH} spaces.`,
      );
    }

    return indent / INDENT_WIDTH;
  }

  private isBlankLine(): boolean {
    let index = this.pos;

    while (index < this.source.length) {
      const char = this.source[index]!;

      if (char === "\n") {
        return true;
      }

      if (char === "#") {
        return true;
      }

      if (char !== " " && char !== "\t" && char !== "\r") {
        return false;
      }

      index += 1;
    }

    return true;
  }

  private skipToNextLine(): void {
    while (this.pos < this.source.length && this.peek() !== "\n") {
      this.advance(this.source[this.pos]!);
    }

    if (this.peek() === "\n") {
      this.advance("\n");
      this.tokens.push(this.makeToken(TokenType.Newline, "\\n"));
    }

    this.atLineStart = true;
  }

  private skipLineComment(): void {
    while (this.pos < this.source.length && this.peek() !== "\n") {
      this.advance(this.source[this.pos]!);
    }
  }

  private skipInlineWhitespace(): void {
    while (this.pos < this.source.length) {
      const char = this.peek();

      if (char === " " || char === "\t" || char === "\r") {
        this.advance(char);
        continue;
      }

      break;
    }
  }

  private readString(): Token {
    const start = this.location();
    this.advance('"');

    let value = "";

    while (this.pos < this.source.length) {
      const char = this.peek();

      if (char === '"') {
        this.advance('"');
        return {
          type: TokenType.String,
          value,
          ...start,
        };
      }

      if (char === "\n") {
        throw this.error("Unterminated string literal.", start);
      }

      if (char === "\\") {
        this.advance("\\");
        if (this.pos >= this.source.length) {
          throw this.error("Unterminated escape sequence.", start);
        }

        const escaped = this.peek();
        this.advance(escaped);

        switch (escaped) {
          case '"':
            value += '"';
            break;
          case "\\":
            value += "\\";
            break;
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          default:
            throw this.error(`Invalid escape sequence '\\${escaped}'.`, start);
        }

        continue;
      }

      value += char;
      this.advance(char);
    }

    throw this.error("Unterminated string literal.", start);
  }

  private readIdentifierOrKeyword(): Token {
    const start = this.location();
    let value = this.advance(this.peek());

    while (this.pos < this.source.length) {
      const char = this.peek();

      if (!this.isIdentifierPart(char)) {
        break;
      }

      value += this.advance(char);
    }

    const topLevel = this.indentStack[this.indentStack.length - 1] === 0;
    const type =
      topLevel && isTopLevelKeyword(value)
        ? TokenType.Keyword
        : TokenType.Identifier;

    return {
      type,
      value,
      ...start,
    };
  }

  private emitDeduentsToRoot(): void {
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.tokens.push(this.makeToken(TokenType.Dedent, ""));
    }
  }

  private isIdentifierStart(char: string): boolean {
    return /[A-Za-z_]/.test(char);
  }

  private isIdentifierPart(char: string): boolean {
    return /[A-Za-z0-9_-]/.test(char);
  }

  private peek(): string {
    return this.source[this.pos] ?? "";
  }

  private advance(expected: string): string {
    const char = this.source[this.pos];

    if (char !== expected) {
      throw this.error(`Expected '${expected}', found '${char ?? "end of file"}'.`);
    }

    this.pos += 1;

    if (char === "\n") {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }

    return char;
  }

  private location(): SourceLocation {
    return { line: this.line, column: this.column };
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
    };
  }

  private error(message: string, location?: SourceLocation): AlangError {
    return new AlangError(message, location ?? this.location());
  }
}

interface SourceLocation {
  line: number;
  column: number;
}

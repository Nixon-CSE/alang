export type { AlangAst, SourceLocation, StackConfig } from "./ast.js";
export { AlangError } from "./errors.js";
export {
  STACK_KEYWORDS,
  TOP_LEVEL_KEYWORDS,
  TOP_LEVEL_VALUE_KEYWORDS,
} from "./keywords.js";
export { lex, TokenType, type Token } from "./lexer.js";
export { parseSource, parseTokens } from "./parser.js";
export { validate } from "./validator.js";

import type { AlangAst } from "./ast.js";
import { lex } from "./lexer.js";
import { parseTokens } from "./parser.js";
import { validate } from "./validator.js";

export function parse(source: string): AlangAst {
  const tokens = lex(source);
  const ast = parseTokens(tokens);
  validate(ast);
  return ast;
}

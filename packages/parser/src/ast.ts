export interface SourceLocation {
  line: number;
  column: number;
}

export interface StackConfig {
  frontend?: string;
  backend?: string;
  database?: string;
}

export interface AlangAst {
  project: string;
  description?: string;
  stack: StackConfig;
  deployment?: string;
  auth?: string;
  agents: string[];
}

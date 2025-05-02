export enum TokenType {
  // Keywords
  LET = "LET",
  CONST = "CONST",
  FUNCTION = "FUNCTION",
  RETURN = "RETURN",
  IF = "IF",
  ELSE = "ELSE",
  WHILE = "WHILE",
  FOR = "FOR",
  CLASS = "CLASS",
  NEW = "NEW",
  EXTENDS = "EXTENDS",
  THIS = "THIS",
  SUPER = "SUPER",
  NULL = "NULL",
  TRUE = "TRUE",
  FALSE = "FALSE",
  PROPERTY = "PROPERTY",

  // Identifiers & literals
  IDENTIFIER = "IDENTIFIER",
  NUMBER = "NUMBER",
  STRING = "STRING",
  TEMPLATE_STRING = "TEMPLATE_STRING",
  TEMPLATE_EXPR = "TEMPLATE_EXPR",

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  MULTIPLY = "MULTIPLY",
  DIVIDE = "DIVIDE",
  MODULO = "MODULO",
  POWER = "POWER",
  ASSIGN = "ASSIGN",
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  GREATER = "GREATER",
  LESS = "LESS",
  GREATER_EQUAL = "GREATER_EQUAL",
  LESS_EQUAL = "LESS_EQUAL",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  SPREAD = "SPREAD",

  // Punctuation
  DOT = "DOT",
  COMMA = "COMMA",
  SEMICOLON = "SEMICOLON",
  COLON = "COLON",
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  LEFT_BRACE = "LEFT_BRACE",
  RIGHT_BRACE = "RIGHT_BRACE",
  LEFT_BRACKET = "LEFT_BRACKET",
  RIGHT_BRACKET = "RIGHT_BRACKET",

  // Special
  EOF = "EOF",
}

export type TokenLiteral =
  | number
  | string
  | boolean
  | null
  | undefined
  | (string | { expr: string })[];

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: TokenLiteral;
  line: number;
}

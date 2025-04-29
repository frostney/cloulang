import { TokenType } from "./token-types";
import type { Token, TokenLiteral } from "./token-types";

export class Lexer {
  private source: string;
  private tokens: Token[] = [];

  private start = 0;
  private current = 0;
  private line = 1;

  private static keywords: Record<string, TokenType> = {
    let: TokenType.LET,
    const: TokenType.CONST,
    function: TokenType.FUNCTION,
    return: TokenType.RETURN,
    if: TokenType.IF,
    else: TokenType.ELSE,
    while: TokenType.WHILE,
    for: TokenType.FOR,
    class: TokenType.CLASS,
    new: TokenType.NEW,
    extends: TokenType.EXTENDS,
    this: TokenType.THIS,
    super: TokenType.SUPER,
    null: TokenType.NULL,
    true: TokenType.TRUE,
    false: TokenType.FALSE,
    and: TokenType.AND,
    or: TokenType.OR,
    not: TokenType.NOT,
  };

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      literal: null,
      line: this.line,
    });

    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      // Single-character tokens
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case "[":
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case "]":
        this.addToken(TokenType.RIGHT_BRACKET);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        if (this.match(".") && this.match(".")) {
          this.addToken(TokenType.SPREAD);
        } else {
          this.addToken(TokenType.DOT);
        }
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case ":":
        this.addToken(TokenType.COLON);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "*":
        this.addToken(TokenType.MULTIPLY);
        break;
      case "/":
        if (this.match("/")) {
          // Line comment
          while (this.peek() != "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match("*")) {
          // Block comment
          while (
            !(this.peek() == "*" && this.peekNext() == "/") &&
            !this.isAtEnd()
          ) {
            if (this.peek() == "\n") this.line++;
            this.advance();
          }
          if (!this.isAtEnd()) {
            this.advance(); // Consume the '*'
            this.advance(); // Consume the '/'
          }
        } else {
          this.addToken(TokenType.DIVIDE);
        }
        break;
      case "%":
        this.addToken(TokenType.MODULO);
        break;
      case "^":
        this.addToken(TokenType.POWER);
        break;

      // Two-character tokens
      case "=":
        this.addToken(this.match("=") ? TokenType.EQUAL : TokenType.ASSIGN);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.NOT_EQUAL : TokenType.NOT);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;

      // Whitespace
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        break;
      case "\n":
        this.line++;
        break;

      // String literals
      case '"':
        this.string('"');
        break;
      case "'":
        this.string("'");
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new Error(
            `Unexpected character '${c}' at line ${this.line.toString()}`
          );
        }
        break;
    }
  }

  private string(quote: string): void {
    while (this.peek() != quote && !this.isAtEnd()) {
      if (this.peek() == "\n") this.line++;
      if (this.peek() == "\\" && this.peekNext() == quote) {
        this.advance(); // Consume the escape character
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line.toString()}`);
    }

    // Consume the closing quote
    this.advance();

    // Extract the string value (without the quotes)
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a decimal part
    if (this.peek() == "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      // Consume decimal digits
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    let type = Lexer.keywords[text];
    type ??= TokenType.IDENTIFIER;

    this.addToken(type);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private addToken(type: TokenType, literal: TokenLiteral = null): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme: text,
      literal,
      line: this.line,
    });
  }
}

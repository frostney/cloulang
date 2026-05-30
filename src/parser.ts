import type { Token } from "./token-types";
import { TokenType } from "./token-types";
import * as AST from "./ast-nodes";
import { Lexer } from "./lexer";
import { ParserError } from "./parser-error";

export class Parser {
  private tokens: Token[];
  private current = 0;
  private source: string;

  constructor(tokens: Token[], source: string) {
    this.tokens = tokens;
    this.source = source;
  }

  parse(): AST.Stmt[] {
    const statements: AST.Stmt[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return statements;
  }

  // Statement parsing methods

  private declaration(): AST.Stmt {
    try {
      if (this.match(TokenType.CLASS)) return this.classDeclaration();
      if (this.match(TokenType.FUNCTION)) return this.function("function");
      if (this.match(TokenType.LET)) return this.varDeclaration(false);
      if (this.match(TokenType.CONST)) return this.varDeclaration(true);

      return this.statement();
    } catch (error) {
      this.synchronize();
      throw error;
    }
  }

  private classDeclaration(): AST.Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");

    let superclass = null;
    if (this.match(TokenType.EXTENDS)) {
      this.consume(TokenType.IDENTIFIER, "Expect superclass name.");
      superclass = AST.createVariable(this.previous());
    }

    this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

    const methods: AST.FunctionStmt[] = [];
    const properties = new Map<string, AST.Expr>();

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.PROPERTY)) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          "Expect property name."
        );
        this.consume(TokenType.ASSIGN, "Expect '=' after property name.");
        const initializer = this.expression();
        this.consume(
          TokenType.SEMICOLON,
          "Expect ';' after property declaration."
        );
        properties.set(name.lexeme, initializer);
      } else {
        methods.push(this.function("method"));
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

    return AST.createClassStmt(name, superclass, methods, properties);
  }

  private parseParameters(): {
    parameters: Token[];
    defaults: (AST.Expr | null)[];
    restParam: Token | null;
  } {
    const parameters: Token[] = [];
    const defaults: (AST.Expr | null)[] = [];
    let restParam: Token | null = null;

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }

        if (this.match(TokenType.SPREAD)) {
          const param = this.consume(
            TokenType.IDENTIFIER,
            "Expect parameter name after '...'."
          );
          parameters.push(param);
          defaults.push(null);
          restParam = param;
          break; // Rest parameter must be the last parameter
        }

        const param = this.consume(
          TokenType.IDENTIFIER,
          "Expect parameter name."
        );
        parameters.push(param);

        // Check for default value
        if (this.match(TokenType.ASSIGN)) {
          defaults.push(this.expression());
        } else {
          defaults.push(null);
        }
      } while (this.match(TokenType.COMMA));
    }

    return { parameters, defaults, restParam };
  }

  private function(kind: string): AST.FunctionStmt {
    if (kind === "method") {
      this.consume(TokenType.FUNCTION, "Expect 'function' keyword for method.");
    }

    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);

    const { parameters, defaults, restParam } = this.parseParameters();

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.block();

    return AST.createFunctionStmt(name, parameters, defaults, body, restParam);
  }

  private varDeclaration(isConst: boolean): AST.Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer: AST.Expr | null = null;
    if (this.match(TokenType.ASSIGN)) {
      // Check if this is a function expression
      if (this.match(TokenType.FUNCTION)) {
        initializer = this.functionExpression();
      } else {
        initializer = this.expression();
      }
    } else if (isConst) {
      throw this.error(this.previous(), "Const variables must be initialized.");
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return AST.createVarStmt(name, initializer, isConst);
  }

  private functionExpression(): AST.FunctionExpr {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'function'.");

    const { parameters, defaults, restParam } = this.parseParameters();

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
    this.consume(TokenType.LEFT_BRACE, "Expect '{' before function body.");
    const body = this.block();

    return AST.createFunctionExpr(null, parameters, defaults, body, restParam);
  }

  private statement(): AST.Stmt {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.LEFT_BRACE))
      return AST.createBlockStmt(this.block());

    return this.expressionStatement();
  }

  private ifStatement(): AST.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return AST.createIfStmt(condition, thenBranch, elseBranch);
  }

  private whileStatement(): AST.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after while condition.");

    const body = this.statement();

    return AST.createWhileStmt(condition, body);
  }

  private forStatement(): AST.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.LET)) {
      initializer = this.varDeclaration(false);
    } else if (this.match(TokenType.CONST)) {
      initializer = this.varDeclaration(true);
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();

    // Desugaring the for loop into a while loop
    if (increment !== null) {
      body = AST.createBlockStmt([
        body,
        AST.createExpressionStmt(
          AST.createBinary(
            increment,
            AST.createLiteral(TokenType.PLUS),
            AST.createLiteral(1)
          )
        ),
      ]);
    }

    condition ??= AST.createLiteral(true);
    body = AST.createWhileStmt(condition, body);

    if (initializer !== null) {
      body = AST.createBlockStmt([initializer, body]);
    }

    return AST.createForStmt(initializer, condition, increment, body);
  }

  private returnStatement(): AST.Stmt {
    const keyword = this.previous();
    let value = null;

    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return AST.createReturnStmt(keyword, value);
  }

  private block(): AST.Stmt[] {
    const statements: AST.Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private expressionStatement(): AST.Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return AST.createExpressionStmt(expr);
  }

  // Expression parsing methods

  private expression(): AST.Expr {
    return this.assignment();
  }

  private assignment(): AST.Expr {
    const expr = this.logicalOr();

    if (this.match(TokenType.ASSIGN)) {
      const equals = this.previous();
      const value = this.assignment();

      if (AST.isVariableExpr(expr)) {
        const name = expr.name;
        return AST.createAssign(name, value);
      } else if (AST.isGetExpr(expr)) {
        return AST.createSet(expr.object, expr.name, value);
      } else if (AST.isIndexExpr(expr)) {
        return AST.createIndexAssignExpr(expr.object, expr.index, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private logicalOr(): AST.Expr {
    let expr = this.logicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.logicalAnd();
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private logicalAnd(): AST.Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private equality(): AST.Expr {
    let expr = this.comparison();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private comparison(): AST.Expr {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private term(): AST.Expr {
    let expr = this.factor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private factor(): AST.Expr {
    let expr = this.unary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous();
      const right = this.unary();
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private unary(): AST.Expr {
    if (this.match(TokenType.NOT, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return AST.createUnary(operator, right);
    }

    return this.power();
  }

  private power(): AST.Expr {
    let expr = this.call();

    while (this.match(TokenType.POWER)) {
      const operator = this.previous();
      const right = this.unary(); // Right-associative
      expr = AST.createBinary(expr, operator, right);
    }

    return expr;
  }

  private call(): AST.Expr {
    let expr = this.primary();

    // Continue as long as we find a call, property access, or index expression
    while (
      this.match(TokenType.LEFT_PAREN) ||
      this.match(TokenType.DOT) ||
      this.match(TokenType.LEFT_BRACKET)
    ) {
      if (this.previous().type === TokenType.LEFT_PAREN) {
        expr = this.finishCall(expr);
      } else if (this.previous().type === TokenType.DOT) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          "Expect property name after '.'."
        );
        expr = AST.createGet(expr, name);
      } else if (this.previous().type === TokenType.LEFT_BRACKET) {
        const bracket = this.previous();
        const index = this.expression();
        this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after index.");
        expr = AST.createIndexExpr(expr, index, bracket);
      }
    }

    return expr;
  }

  private finishCall(callee: AST.Expr): AST.Expr {
    const args: AST.Expr[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments."
    );

    if (AST.isVariableExpr(callee) && callee.name.lexeme === "new") {
      // Handle 'new' expressions
      if (args.length === 0) {
        throw this.error(paren, "Expected class name after 'new'.");
      }

      const className = (args[0] as AST.VariableExpr).name;
      const constructorArgs = args.slice(1);

      return AST.createNew(className, paren, constructorArgs);
    }

    return AST.createCall(callee, paren, args);
  }

  private primary(): AST.Expr {
    if (this.match(TokenType.FALSE)) return AST.createLiteral(false);
    if (this.match(TokenType.TRUE)) return AST.createLiteral(true);
    if (this.match(TokenType.NULL)) return AST.createLiteral(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return AST.createLiteral(this.previous().literal);
    }
    if (this.match(TokenType.TEMPLATE_STRING)) {
      const literal = this.previous().literal;
      if (Array.isArray(literal)) {
        const parts = literal as (string | { expr: string })[];
        // Parse each expression in the template string
        const parsedParts = parts.map((part) => {
          if (typeof part === "string") {
            return part;
          } else {
            // Parse the expression
            if (!part.expr.trim()) {
              return { expr: AST.createLiteral(null) };
            }
            const lexer = new Lexer(part.expr);
            const tokens = lexer.scanTokens();
            const parser = new Parser(tokens, this.source);
            const expr = parser.expression();
            return { expr };
          }
        });
        return AST.createTemplateStringExpr(parsedParts);
      }
      throw new Error("Invalid template string literal");
    }

    if (this.match(TokenType.THIS)) return AST.createThis(this.previous());

    if (this.match(TokenType.IDENTIFIER)) {
      return AST.createVariable(this.previous());
    }

    if (this.match(TokenType.SUPER)) {
      const keyword = this.previous();
      this.consume(TokenType.DOT, "Expect '.' after 'super'.");
      const method = this.consume(
        TokenType.IDENTIFIER,
        "Expect superclass method name."
      );
      return AST.createSuper(keyword, method);
    }

    if (this.match(TokenType.FUNCTION)) {
      return this.functionExpression();
    }

    if (this.match(TokenType.NEW)) {
      const className = this.consume(
        TokenType.IDENTIFIER,
        "Expect class name after 'new'."
      );
      const paren = this.consume(
        TokenType.LEFT_PAREN,
        "Expect '(' after class name."
      );

      const args: AST.Expr[] = [];
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          args.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }

      this.consume(
        TokenType.RIGHT_PAREN,
        "Expect ')' after constructor arguments."
      );
      return AST.createNew(className, paren, args);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return AST.createGrouping(expr);
    }

    if (this.match(TokenType.LEFT_BRACKET)) {
      return this.array();
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      const properties = new Map<string, AST.Expr>();

      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          // Parse the key
          const key = this.consume(
            TokenType.IDENTIFIER,
            "Expect property name."
          ).lexeme;

          // Parse the value
          this.consume(TokenType.COLON, "Expect ':' after property name.");
          const value = this.expression();

          properties.set(key, value);
        } while (this.match(TokenType.COMMA));
      }

      this.consume(
        TokenType.RIGHT_BRACE,
        "Expect '}' after object properties."
      );
      return AST.createObjectExpr(properties);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private array(): AST.Expr {
    const elements: AST.Expr[] = [];
    if (!this.check(TokenType.RIGHT_BRACKET)) {
      do {
        elements.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after array elements.");
    return AST.createArrayExpr(elements);
  }

  // Helper methods

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    const token = this.tokens[this.current];
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    return token;
  }

  private previous(): Token {
    const token = this.tokens[this.current - 1];
    if (!token) {
      throw new Error("No previous token available");
    }
    return token;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): Error {
    return new ParserError(message, token, this.source);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUNCTION:
        case TokenType.LET:
        case TokenType.CONST:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}

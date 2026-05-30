import type { Token } from "./token-types";
import { ModuleSystem } from "./module-system";
import { Environment, ReturnError } from "./environment";
import type { ValueType } from "./environment";
import {
  ClouInstance,
  ClouClass,
  ClouFunction,
  RuntimeError,
} from "./environment";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { TokenType } from "./token-types";
import * as AST from "./ast-nodes";

// Main interpreter class
export class Interpreter {
  readonly globals = new Environment();
  private environment: Environment = this.globals;
  public moduleSystem: ModuleSystem;
  public currentDir = ".";
  private moduleCallStack = new Map<Environment, Set<string>>();
  private currentSource = ""; // Track current source code

  constructor(moduleSystem?: ModuleSystem) {
    this.moduleSystem = moduleSystem ?? new ModuleSystem();

    // Define native functions and globals
    this.globals.define(
      "print",
      (...args: ValueType[]) => {
        const stringified = args.map((arg) => {
          if (Array.isArray(arg)) {
            return arg.map(this.stringify).join(" ");
          }
          return this.stringify(arg);
        });
        console.log(stringified.join(" "));
        return null;
      },
      true
    );

    this.globals.define(
      "clock",
      () => {
        return Date.now() / 1000;
      },
      true
    );

    this.globals.define(
      "len",
      (obj: ValueType) => {
        if (Array.isArray(obj)) return obj.length;
        if (typeof obj === "string") return obj.length;
        if (obj instanceof Map) return obj.size;
        throw new RuntimeError(
          "len() requires array, string, or object argument"
        );
      },
      true
    );

    this.globals.define(
      "require",
      (path: string) => {
        if (typeof path !== "string") {
          throw new RuntimeError("Require path must be a string.");
        }

        // Check if module is already loaded
        const cached = this.moduleSystem.getCachedModule(path);
        if (cached) {
          return cached;
        }

        // Create a new environment for the module
        const moduleEnv = new Environment(this.globals);
        const exportsObj = {};
        moduleEnv.define("exports", exportsObj as ValueType, false);

        // Cache the exports object immediately to handle circular dependencies
        this.moduleSystem.cacheModule(path, exportsObj as ValueType);

        // Get and parse the module source
        const source = this.moduleSystem.getModuleSource(path, this.currentDir);
        const lexer = new Lexer(source);
        const tokens = lexer.scanTokens();
        const parser = new Parser(tokens, source);
        const statements = parser.parse();

        // Execute the module in its own environment
        this.withEnvironment(moduleEnv, () => {
          this.interpret(statements, source);
        });

        return exportsObj;
      },
      true
    );
  }

  interpret(statements: AST.Stmt[], source = ""): ValueType[] {
    this.currentSource = source;
    const results: ValueType[] = [];
    for (const statement of statements) {
      results.push(this.execute(statement));
    }
    return results;
  }

  // Statement execution
  execute(stmt: AST.Stmt): ValueType {
    if (AST.isExpressionStmt(stmt)) {
      return this.evaluate(stmt.expression);
    }

    if (AST.isVarStmt(stmt)) {
      let value = null;
      if (stmt.initializer) {
        value = this.evaluate(stmt.initializer);
      }
      this.environment.define(stmt.name.lexeme, value, stmt.isConst);
      return null;
    }

    if (AST.isBlockStmt(stmt)) {
      this.executeBlock(stmt.statements, new Environment(this.environment));
      return null;
    }

    if (AST.isIfStmt(stmt)) {
      if (this.isTruthy(this.evaluate(stmt.condition))) {
        this.execute(stmt.thenBranch);
      } else if (stmt.elseBranch) {
        this.execute(stmt.elseBranch);
      }
      return null;
    }

    if (AST.isWhileStmt(stmt)) {
      while (this.isTruthy(this.evaluate(stmt.condition))) {
        this.execute(stmt.body);
      }
      return null;
    }

    if (AST.isForStmt(stmt)) {
      // For loops are desugared to while loops in the parser
      this.execute(stmt.body);
      return null;
    }

    if (AST.isFunctionStmt(stmt)) {
      const func = new ClouFunction(stmt, this.environment);
      if (stmt.name) {
        this.environment.define(stmt.name.lexeme, func);
        return null;
      }
      return func;
    }

    if (AST.isReturnStmt(stmt)) {
      let value = null;
      if (stmt.value) {
        value = this.evaluate(stmt.value);
      }
      throw new ReturnError(value);
    }

    if (AST.isClassStmt(stmt)) {
      let superclass = null;
      if (stmt.superclass !== null) {
        superclass = this.evaluate(stmt.superclass);
        if (!(superclass instanceof ClouClass)) {
          throw new RuntimeError("Superclass must be a class.");
        }
      }

      // Create a new environment for the class
      const classEnvironment = new Environment(this.environment);
      this.environment.define(stmt.name.lexeme, null, false);

      // Process methods in the class environment
      const methods = new Map<string, ClouFunction>();

      const processMethods = () => {
        for (const method of stmt.methods) {
          const function_ = new ClouFunction(
            method,
            this.environment,
            method.name?.lexeme === "init"
          );
          methods.set(method.name?.lexeme ?? "", function_);
        }
      };

      // If there's a superclass, set up the inheritance chain
      if (stmt.superclass !== null) {
        this.withEnvironment(classEnvironment, () => {
          this.environment.define("super", superclass);
          processMethods();
        });
      } else {
        processMethods();
      }

      // Create the class
      const klass = new ClouClass(stmt.name.lexeme, superclass, methods);

      // Initialize properties
      for (const [name, initializer] of stmt.properties) {
        const value = this.evaluate(initializer);
        klass.setProperty(name, value);
      }

      // Define the class in the outer environment
      this.environment.assign(stmt.name, klass);
      return null;
    }

    if (AST.isExportStmt(stmt)) {
      const exportsToken = {
        type: TokenType.IDENTIFIER,
        lexeme: "exports",
        literal: null,
        line: stmt.name.line,
      };
      const exports = this.environment.get(exportsToken);

      let value;
      if (stmt.value) {
        value = this.evaluate(stmt.value);
      } else {
        try {
          value = this.environment.get(stmt.name);
        } catch {
          throw new RuntimeError(
            `Cannot export undefined variable '${stmt.name.lexeme}'`
          );
        }
      }

      if (typeof exports !== "object" || exports === null) {
        throw new RuntimeError("exports must be an object");
      }

      // Type assertion for exports object
      const exportsObj = exports as unknown as Record<string, ValueType>;
      exportsObj[stmt.name.lexeme] = value;
      return null;
    }

    throw new Error(
      `Unknown statement type: ${(stmt as { type: string }).type}`
    );
  }

  // Expression evaluation
  evaluate(expr: AST.Expr): ValueType {
    if (AST.isBinaryExpr(expr)) {
      const left = this.evaluate(expr.left);
      const right = this.evaluate(expr.right);

      switch (expr.operator.type) {
        case TokenType.PLUS:
          if (typeof left === "number" && typeof right === "number") {
            return left + right;
          }
          if (typeof left === "string" || typeof right === "string") {
            return String(left as string) + String(right as string);
          }
          throw new RuntimeError(
            "Operands must be numbers or strings.",
            expr.operator,
            this.currentSource
          );
        case TokenType.MINUS:
          this.checkNumberOperands(expr.operator, left, right);
          return (left as number) - (right as number);
        case TokenType.MULTIPLY:
          this.checkNumberOperands(expr.operator, left, right);
          return (left as number) * (right as number);
        case TokenType.DIVIDE:
          this.checkNumberOperands(expr.operator, left, right);
          if (right === 0) {
            throw new RuntimeError(
              "Division by zero.",
              expr.operator,
              this.currentSource
            );
          }
          return (left as number) / (right as number);
        case TokenType.MODULO:
          this.checkNumberOperands(expr.operator, left, right);
          if (right === 0) {
            throw new RuntimeError(
              "Modulo by zero.",
              expr.operator,
              this.currentSource
            );
          }
          return (left as number) % (right as number);
        case TokenType.POWER:
          this.checkNumberOperands(expr.operator, left, right);
          return Math.pow(left as number, right as number);
        case TokenType.GREATER:
          this.checkNumberOperands(expr.operator, left, right);
          return (left as number) > (right as number);
        case TokenType.GREATER_EQUAL:
          this.checkNumberOperands(expr.operator, left, right);
          return (left as number) >= (right as number);
        case TokenType.LESS:
          this.checkNumberOperands(expr.operator, left, right);
          return (left as number) < (right as number);
        case TokenType.LESS_EQUAL:
          this.checkNumberOperands(expr.operator, left, right);
          return (left as number) <= (right as number);
        case TokenType.EQUAL:
          return this.isEqual(left, right);
        case TokenType.NOT_EQUAL:
          return !this.isEqual(left, right);
        default:
          throw new RuntimeError(
            `Unknown operator: ${expr.operator.lexeme}`,
            expr.operator,
            this.currentSource
          );
      }
    }

    if (AST.isGroupingExpr(expr)) {
      return this.evaluate(expr.expression);
    }

    if (AST.isLiteralExpr(expr)) {
      const value = expr.value;
      if (value === undefined) {
        return null;
      }
      return value as ValueType;
    }

    if (AST.isUnaryExpr(expr)) {
      const right = this.evaluate(expr.right);
      switch (expr.operator.type) {
        case TokenType.MINUS:
          this.checkNumberOperand(expr.operator, right);
          return -(right as number);
        case TokenType.NOT:
          return !this.isTruthy(right);
        default:
          throw new RuntimeError(
            `Unknown operator: ${expr.operator.lexeme}`,
            expr.operator,
            this.currentSource
          );
      }
    }

    if (AST.isVariableExpr(expr)) {
      return this.environment.get(expr.name);
    }

    if (AST.isAssignExpr(expr)) {
      const value = this.evaluate(expr.value);
      this.environment.assign(expr.name, value);
      return value;
    }

    if (AST.isLogicalExpr(expr)) {
      const left = this.evaluate(expr.left);
      if (expr.operator.type === TokenType.OR) {
        if (this.isTruthy(left)) return left;
      } else {
        if (!this.isTruthy(left)) return left;
      }
      return this.evaluate(expr.right);
    }

    if (AST.isCallExpr(expr)) {
      const callee = this.evaluate(expr.callee);

      if (typeof callee !== "function" && !(callee instanceof ClouFunction)) {
        throw new RuntimeError(
          "Can only call functions and classes.",
          expr.paren,
          this.currentSource
        );
      }

      // If the callee is a method (accessed through Get), it's already bound
      if (callee instanceof ClouFunction) {
        // Create a new environment for the method call
        const environment = new Environment(callee.closure);

        // If this is a method call (has boundThis), define 'this' in the environment
        if (callee.boundThis) {
          environment.define("this", callee.boundThis);
        }

        // Get the module environment
        const moduleEnv = callee.closure;
        if (!this.moduleCallStack.has(moduleEnv)) {
          this.moduleCallStack.set(moduleEnv, new Set());
        }
        const callStack = this.moduleCallStack.get(moduleEnv);

        if (!callStack) {
          throw new RuntimeError("Module call stack not found.");
        }

        // Check for circular function calls
        const functionName = callee.declaration.name;
        if (functionName) {
          const functionKey = functionName.lexeme;
          if (callStack.has(functionKey)) {
            // Break the cycle by returning a default value
            return "";
          }
          callStack.add(functionKey);
        }

        // Temporarily set the environment for the method call
        const previous = this.environment;
        this.environment = environment;

        try {
          // Evaluate the arguments
          const args = expr.args.map((arg) => this.evaluate(arg));

          // Call the function
          const result = callee.call(this, args);

          // Restore the previous environment
          this.environment = previous;

          // Remove the function from the call stack
          if (functionName) {
            callStack.delete(functionName.lexeme);
          }

          return result;
        } catch (e) {
          // Restore the previous environment
          this.environment = previous;

          // Remove the function from the call stack
          if (functionName) {
            callStack.delete(functionName.lexeme);
          }

          throw e;
        }
      }

      // Native function call
      const args = expr.args.map((arg) => this.evaluate(arg));
      return callee(...args);
    }

    if (AST.isGetExpr(expr)) {
      const object = this.evaluate(expr.object);
      if (object instanceof ClouInstance) {
        return object.get(expr.name);
      }
      if (typeof object === "object" && object !== null) {
        return (object as Record<string, ValueType>)[expr.name.lexeme];
      }
      throw new RuntimeError(
        "Only instances and objects have properties.",
        expr.name,
        this.currentSource
      );
    }

    if (AST.isSetExpr(expr)) {
      const object = this.evaluate(expr.object);
      const value = this.evaluate(expr.value);
      if (object instanceof ClouInstance) {
        object.set(expr.name, value);
        return value;
      }
      if (typeof object === "object" && object !== null) {
        (object as Record<string, ValueType>)[expr.name.lexeme] = value;
        return value;
      }
      throw new RuntimeError(
        "Only instances and objects have fields.",
        expr.name,
        this.currentSource
      );
    }

    if (AST.isThisExpr(expr)) {
      return this.environment.get(expr.keyword);
    }

    if (AST.isSuperExpr(expr)) {
      const distance = this.locals.get(expr);
      const superclass = this.environment.getAt(distance, "super");
      if (!(superclass instanceof ClouClass)) {
        throw new RuntimeError(
          "Superclass must be a class.",
          expr.keyword,
          this.currentSource
        );
      }
      const object = this.environment.getAt(distance - 1, "this");
      if (!(object instanceof ClouInstance)) {
        throw new RuntimeError(
          "Can only use 'super' in a method.",
          expr.keyword,
          this.currentSource
        );
      }
      const method = superclass.findMethod(expr.method.lexeme);
      if (!method) {
        throw new RuntimeError(
          `Undefined property '${expr.method.lexeme}'.`,
          expr.method,
          this.currentSource
        );
      }
      return method.bind(object);
    }

    if (AST.isNewExpr(expr)) {
      const callee = this.evaluate(expr.className);
      if (!(callee instanceof ClouClass)) {
        throw new RuntimeError(
          "Can only instantiate classes.",
          expr.className,
          this.currentSource
        );
      }
      const args = expr.args.map((arg) => this.evaluate(arg));
      return callee.instantiate(this, args);
    }

    if (AST.isArrayExpr(expr)) {
      return expr.elements.map((element) => this.evaluate(element));
    }

    if (AST.isObjectExpr(expr)) {
      const object: Record<string, ValueType> = {};
      for (const [key, value] of expr.properties) {
        object[key] = this.evaluate(value);
      }
      return object;
    }

    if (AST.isIndexExpr(expr)) {
      const object = this.evaluate(expr.object);
      const index = this.evaluate(expr.index);
      if (Array.isArray(object)) {
        if (typeof index !== "number") {
          throw new RuntimeError(
            "Array index must be a number.",
            expr.bracket,
            this.currentSource
          );
        }
        if (index < 0 || index >= object.length) {
          throw new RuntimeError(
            "Array index out of bounds.",
            expr.bracket,
            this.currentSource
          );
        }
        return object[index];
      }
      if (typeof object === "object" && object !== null) {
        if (typeof index !== "string") {
          throw new RuntimeError(
            "Object index must be a string.",
            expr.bracket,
            this.currentSource
          );
        }
        return (object as Record<string, ValueType>)[index];
      }
      throw new RuntimeError(
        "Only arrays and objects can be indexed.",
        expr.bracket,
        this.currentSource
      );
    }

    if (AST.isIndexAssignExpr(expr)) {
      const object = this.evaluate(expr.object);
      const index = this.evaluate(expr.index);
      const value = this.evaluate(expr.value);
      if (Array.isArray(object)) {
        if (typeof index !== "number") {
          throw new RuntimeError(
            "Array index must be a number.",
            expr.bracket,
            this.currentSource
          );
        }
        if (index < 0 || index >= object.length) {
          throw new RuntimeError(
            "Array index out of bounds.",
            expr.bracket,
            this.currentSource
          );
        }
        object[index] = value;
        return value;
      }
      if (typeof object === "object" && object !== null) {
        if (typeof index !== "string") {
          throw new RuntimeError(
            "Object index must be a string.",
            expr.bracket,
            this.currentSource
          );
        }
        (object as Record<string, ValueType>)[index] = value;
        return value;
      }
      throw new RuntimeError(
        "Only arrays and objects can be indexed.",
        expr.bracket,
        this.currentSource
      );
    }

    if (AST.isTemplateStringExpr(expr)) {
      return expr.parts
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }
          return this.stringify(this.evaluate(part.expr));
        })
        .join("");
    }

    if (AST.isFunctionExpr(expr)) {
      return new ClouFunction(expr, this.environment);
    }

    throw new RuntimeError(
      `Unknown expression type: ${(expr as { type: string }).type}`,
      null,
      this.currentSource
    );
  }

  // Helper methods
  private withEnvironment<T>(newEnv: Environment, fn: () => T): T {
    const previous = this.environment;
    this.environment = newEnv;
    try {
      return fn();
    } finally {
      this.environment = previous;
    }
  }

  private stringify = (value: ValueType): string => {
    if (Array.isArray(value)) {
      return `[${(value as ValueType[]).map(this.stringify).join(", ")}]`;
    }
    if (value instanceof ClouInstance) {
      return value.toString();
    }
    if (typeof value === "object" && value !== null) {
      if (Object.keys(value).length === 0) {
        return "{}";
      }
      const entries = Object.entries(value).map(
        ([k, v]) => `${k}: ${this.stringify(v as ValueType)}`
      );
      return `{ ${entries.join(", ")} }`;
    }
    return String(value);
  };

  executeBlock(statements: AST.Stmt[], environment: Environment): void {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  isTruthy(value: ValueType): boolean {
    if (value === null) return false;
    if (typeof value === "boolean") return value;
    if (value === 0) return false;
    if (value === "") return false;
    return true;
  }

  isEqual(a: ValueType, b: ValueType): boolean {
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }

  checkNumberOperand(operator: Token, operand: ValueType): void {
    if (typeof operand === "number") {
      return;
    }

    throw new RuntimeError(
      "Operand must be a number.",
      operator,
      this.currentSource
    );
  }

  checkNumberOperands(
    operator: Token,
    left: ValueType,
    right: ValueType
  ): void {
    if (typeof left === "number" && typeof right === "number") {
      return;
    }
    throw new RuntimeError(
      "Operands must be numbers.",
      operator,
      this.currentSource
    );
  }
}

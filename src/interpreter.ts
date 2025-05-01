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
import type * as AST from "./ast-nodes";

// Main interpreter class
export class Interpreter implements AST.Visitor<ValueType> {
  readonly globals = new Environment();
  private environment: Environment = this.globals;
  public moduleSystem: ModuleSystem;
  public currentDir = ".";
  private moduleCallStack = new Map<Environment, Set<string>>();
  private loadingModules = new Set<string>(); // Track modules being loaded

  constructor(moduleSystem?: ModuleSystem) {
    this.moduleSystem = moduleSystem ?? new ModuleSystem();

    // Define native functions and globals
    this.globals.define(
      "print",
      (...args: ValueType[]) => {
        const stringify = (value: ValueType): string => {
          if (Array.isArray(value)) {
            return `[${(value as ValueType[]).map(stringify).join(", ")}]`;
          }
          if (value instanceof ClouInstance) {
            return value.toString();
          }
          if (typeof value === "object" && value !== null) {
            if (Object.keys(value).length === 0) {
              return "{}";
            }
            const entries = Object.entries(value).map(([key, val]) => {
              return `${key}: ${stringify(val as ValueType)}`;
            });
            return `{ ${entries.join(", ")} }`;
          }
          return String(value);
        };

        const stringified = args.map(stringify);
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
        const parser = new Parser(tokens);
        const statements = parser.parse();

        // Execute the module in its own environment
        const previousEnv = this.environment;
        this.environment = moduleEnv;

        try {
          // Execute the module code
          this.interpret(statements);
        } finally {
          this.environment = previousEnv;
        }

        return exportsObj;
      },
      true
    );
  }

  interpret(statements: AST.Stmt[]): ValueType[] {
    const results: ValueType[] = [];
    for (const statement of statements) {
      results.push(this.execute(statement));
    }
    return results;
  }

  // Statement visitors

  visitExpressionStmt(stmt: AST.Expression): ValueType {
    return this.evaluate(stmt.expression);
  }

  visitVarStmt(stmt: AST.Var): ValueType {
    let value = null;
    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value, stmt.isConst);
    return null;
  }

  visitBlockStmt(stmt: AST.Block): ValueType {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }

  visitIfStmt(stmt: AST.If): ValueType {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
    return null;
  }

  visitWhileStmt(stmt: AST.While): ValueType {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return null;
  }

  visitForStmt(stmt: AST.For): ValueType {
    // For loops are desugared to while loops in the parser
    this.execute(stmt.body);
    return null;
  }

  visitFunctionStmt(stmt: AST.Function): ValueType {
    const func = new ClouFunction(stmt, this.environment);
    if (stmt.name) {
      this.environment.define(stmt.name.lexeme, func);
      return null;
    }
    return func;
  }

  visitReturnStmt(stmt: AST.Return): ValueType {
    let value = null;
    if (stmt.value) {
      value = this.evaluate(stmt.value);
    }

    throw new ReturnError(value);
  }

  visitClassStmt(stmt: AST.Class): ValueType {
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

    // If there's a superclass, set up the inheritance chain
    if (stmt.superclass !== null) {
      // Store the current environment
      const previousEnv = this.environment;
      this.environment = classEnvironment;

      // Define 'super' in the class environment
      this.environment.define("super", superclass);

      // Process methods in the class environment
      const methods = new Map<string, ClouFunction>();
      for (const method of stmt.methods) {
        const function_ = new ClouFunction(method, this.environment);
        methods.set(method.name?.lexeme ?? "", function_);
      }

      // Create the class
      const klass = new ClouClass(stmt.name.lexeme, superclass, methods);

      // Restore the previous environment
      this.environment = previousEnv;

      // Define the class in the outer environment
      this.environment.assign(stmt.name, klass);
      return null;
    }

    // If no superclass, process methods in the current environment
    const methods = new Map<string, ClouFunction>();
    for (const method of stmt.methods) {
      const function_ = new ClouFunction(
        method,
        this.environment,
        method.name?.lexeme === "init"
      );
      methods.set(method.name?.lexeme ?? "", function_);
    }

    const klass = new ClouClass(stmt.name.lexeme, superclass, methods);
    this.environment.assign(stmt.name, klass);
    return null;
  }

  visitExportStmt(stmt: AST.Export): ValueType {
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

  // Expression visitors

  visitBinaryExpr(expr: AST.Binary): ValueType {
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
        throw new RuntimeError("Operands must be numbers or strings.");
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      case TokenType.MULTIPLY:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      case TokenType.DIVIDE:
        this.checkNumberOperands(expr.operator, left, right);
        if (right === 0) {
          throw new RuntimeError("Division by zero.");
        }
        return (left as number) / (right as number);
      case TokenType.MODULO:
        this.checkNumberOperands(expr.operator, left, right);
        if (right === 0) {
          throw new RuntimeError("Modulo by zero.");
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
    }

    return null;
  }

  visitGroupingExpr(expr: AST.Grouping): ValueType {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: AST.Literal): ValueType {
    return expr.value as ValueType;
  }

  visitUnaryExpr(expr: AST.Unary): ValueType {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
      case TokenType.NOT:
        return !this.isTruthy(right);
    }

    return null;
  }

  visitVariableExpr(expr: AST.Variable): ValueType {
    return this.environment.get(expr.name);
  }

  visitAssignExpr(expr: AST.Assign): ValueType {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  visitLogicalExpr(expr: AST.Logical): ValueType {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitCallExpr(expr: AST.Call): ValueType {
    const callee = this.evaluate(expr.callee);
    const args = expr.args.map((arg) => this.evaluate(arg));

    if (typeof callee !== "function" && !(callee instanceof ClouFunction)) {
      throw new RuntimeError("Can only call functions and classes.");
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
      const functionKey = callee.declaration.name?.lexeme ?? "anonymous";
      if (callStack.has(functionKey)) {
        // Break the cycle by returning a default value
        return "";
      }

      // Temporarily set the environment for the method call
      const previous = this.environment;
      this.environment = environment;

      // Add the function to the module's call stack
      callStack.add(functionKey);

      try {
        return callee.call(this, args);
      } finally {
        // Restore the previous environment and remove from call stack
        this.environment = previous;
        callStack.delete(functionKey);
        if (callStack.size === 0) {
          this.moduleCallStack.delete(moduleEnv);
        }
      }
    }

    // Native function
    return callee(...args) as ValueType;
  }

  visitGetExpr(expr: AST.Get): ValueType {
    const object = this.evaluate(expr.object);

    if (object instanceof ClouInstance) {
      return object.get(expr.name);
    }

    if (typeof object === "object" && object !== null) {
      const obj = object as unknown as Record<string, ValueType>;
      const value = obj[expr.name.lexeme];
      if (value === undefined) {
        return expr.name.lexeme; // Return the property name instead of undefined
      }
      if (value instanceof ClouFunction) {
        return value.bind(object as unknown as ClouInstance);
      }
      return value;
    }

    // Handle string methods
    if (typeof object === "string") {
      switch (expr.name.lexeme) {
        case "includes":
          return (searchStr: string) => object.includes(searchStr);
        case "split":
          return (separator: string) => object.split(separator);
        case "slice":
          return (start: number, end?: number) => object.slice(start, end);
        case "length":
          return object.length;
      }
    }

    // Handle number methods
    if (typeof object === "number") {
      switch (expr.name.lexeme) {
        case "toFixed":
          return (digits: number) => object.toFixed(digits);
      }
    }

    throw new RuntimeError("Only instances and objects have properties.");
  }

  visitSetExpr(expr: AST.Set): ValueType {
    const object = this.evaluate(expr.object);

    if (
      !(object instanceof ClouInstance) &&
      !(typeof object === "object" && object !== null)
    ) {
      throw new RuntimeError("Only instances and objects have fields.");
    }

    const value = this.evaluate(expr.value);

    if (object instanceof ClouInstance) {
      object.set(expr.name, value);
    } else {
      const obj = object as unknown as Record<string, ValueType>;
      obj[expr.name.lexeme] = value;
    }

    return value;
  }

  visitThisExpr(expr: AST.This): ValueType {
    return this.environment.get(expr.keyword);
  }

  visitSuperExpr(expr: AST.Super): ValueType {
    const superclass = this.environment.get({
      lexeme: "super",
    } as Token) as ClouClass;
    const instance = this.environment.get({
      lexeme: "this",
    } as Token) as ClouInstance;

    const method = superclass.findMethod(expr.method.lexeme);
    if (!method) {
      throw new RuntimeError(`Undefined property '${expr.method.lexeme}'.`);
    }

    return method.bind(instance);
  }

  visitNewExpr(expr: AST.New): ValueType {
    const className = expr.className.lexeme;
    const classValue = this.environment.get({ lexeme: className } as Token);

    if (!(classValue instanceof ClouClass)) {
      throw new RuntimeError(`${className} is not a class.`);
    }

    const instance = new ClouInstance(classValue);

    // Call the initializer if it exists
    const initializer = classValue.findMethod("init");
    if (initializer) {
      const boundInitializer = initializer.bind(instance);
      const args = expr.args.map((arg) => this.evaluate(arg));
      boundInitializer.call(this, args);
    }

    return instance;
  }

  visitArrayExpr(expr: AST.ArrayExpr): ValueType {
    const elements = expr.elements.map((element) => this.evaluate(element));
    elements.toString = function () {
      return `[${(this as (string | number)[]).join(", ")}]`;
    };

    return elements;
  }

  visitObjectExpr(expr: AST.Object): ValueType {
    const result: Record<string, ValueType> = {};

    for (const [key, valueExpr] of expr.properties.entries()) {
      result[key] = this.evaluate(valueExpr);
    }

    return result as unknown as ValueType;
  }

  visitIndexExpr(expr: AST.Index): ValueType {
    const object = this.evaluate(expr.object);
    const index = this.evaluate(expr.index);

    if (Array.isArray(object)) {
      if (
        typeof index !== "number" ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= object.length
      ) {
        throw new RuntimeError("Array index out of bounds.");
      }
      const value = object[index];
      if (value === undefined) {
        throw new RuntimeError("Array index out of bounds.");
      }
      return value;
    }

    if (typeof object === "string") {
      if (
        typeof index !== "number" ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= object.length
      ) {
        throw new RuntimeError("String index out of bounds.");
      }
      const char = object[index];
      if (char === undefined) {
        throw new RuntimeError("String index out of bounds.");
      }
      return char;
    }

    if (typeof object === "object" && object !== null) {
      if (
        object instanceof ClouInstance ||
        object instanceof ClouClass ||
        object instanceof ClouFunction
      ) {
        throw new RuntimeError(
          "Cannot index into class, function, or instance directly."
        );
      }
      // Type guard for plain objects
      if (Object.getPrototypeOf(object) === Object.prototype) {
        const obj = object as Record<string | number, ValueType>;
        const key =
          typeof index === "string" || typeof index === "number"
            ? index
            : String(index as unknown as string | number);
        const value = obj[key];
        if (value === undefined) {
          throw new RuntimeError("Object property not found.");
        }
        return value;
      }
      throw new RuntimeError("Only plain objects are indexable.");
    }

    throw new RuntimeError("Only arrays, strings, and objects are indexable.");
  }

  visitIndexAssignExpr(expr: AST.IndexAssign): ValueType {
    const object = this.evaluate(expr.object);
    const index = this.evaluate(expr.index);
    const value = this.evaluate(expr.value);

    if (Array.isArray(object)) {
      if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
        throw new RuntimeError("Array index out of bounds.");
      }
      object[index] = value;
      return value;
    }

    if (typeof object === "object" && object !== null) {
      if (
        object instanceof ClouInstance ||
        object instanceof ClouClass ||
        object instanceof ClouFunction
      ) {
        throw new RuntimeError(
          "Cannot assign to class, function, or instance directly."
        );
      }
      // Type guard for plain objects
      if (Object.getPrototypeOf(object) === Object.prototype) {
        const obj = object as Record<string | number, ValueType>;
        const key =
          typeof index === "string" || typeof index === "number"
            ? index
            : String(index as unknown as string | number);
        obj[key] = value;
        return value;
      }
      throw new RuntimeError(
        "Only plain objects are indexable for assignment."
      );
    }

    throw new RuntimeError(
      "Only arrays and objects are indexable for assignment."
    );
  }

  // Helper methods

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

  execute(stmt: AST.Stmt): ValueType {
    return stmt.accept(this);
  }

  evaluate(expr: AST.Expr): ValueType {
    return expr.accept(this);
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

    throw new RuntimeError("Operand must be a number.");
  }

  checkNumberOperands(
    operator: Token,
    left: ValueType,
    right: ValueType
  ): void {
    if (typeof left === "number" && typeof right === "number") {
      return;
    }
    throw new RuntimeError("Operands must be numbers.");
  }
}

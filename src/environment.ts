import type { Interpreter } from "./interpreter";
import type { Token } from "./token-types";
import type * as AST from "./ast-nodes";
import { HiddenClass, type IHiddenClass } from "./hidden-class";

export type ValueType =
  | number
  | string
  | boolean
  | null
  | Function
  | ClouInstance
  | ClouClass
  | ClouFunction
  | ValueType[];

export class RuntimeError extends Error {
  constructor(message: string, public token?: Token, public source?: string) {
    super(message);
    this.name = "RuntimeError";

    if (token && source) {
      const lines = source.split("\n");
      const lineNumber = token.line;
      const startLine = Math.max(1, lineNumber - 2);
      const endLine = Math.min(lines.length, lineNumber + 2);

      let context = "";
      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i - 1] ?? "";
        const prefix = i === lineNumber ? ">" : " ";
        context += `${prefix} ${i.toString().padStart(3)} | ${line}\n`;
        if (i === lineNumber) {
          const column =
            token.lexeme.length > 0
              ? line.indexOf(token.lexeme) + 1
              : line.length;
          context +=
            "    " +
            " ".repeat(column + 5) +
            "^".repeat(token.lexeme.length || 1) +
            "\n";
        }
      }

      // Add suggestions based on error type
      let suggestion = "";
      if (message.includes("Undefined variable")) {
        suggestion =
          "\nSuggestion: Declare the variable before using it, e.g.:\n" +
          "  let " +
          token.lexeme +
          " = <value>;";
      } else if (message.includes("Cannot reassign const variable")) {
        suggestion =
          "\nSuggestion: Use `let` instead of `const` if you need to reassign the variable, e.g.:\n" +
          "  let " +
          token.lexeme +
          " = <value>;";
      } else if (message.includes("Division by zero")) {
        suggestion =
          "\nSuggestion: Add a check before division, e.g.:\n" +
          "  if (y !== 0) {\n" +
          "    let z = x / y;\n" +
          "  }";
      } else if (message.includes("Array index out of bounds")) {
        suggestion =
          "\nSuggestion: Check array length before accessing, e.g.:\n" +
          "  if (index >= 0 && index < array.length) {\n" +
          "    let value = array[index];\n" +
          "  }";
      } else if (message.includes("String index out of bounds")) {
        suggestion =
          "\nSuggestion: Check string length before accessing, e.g.:\n" +
          "  if (index >= 0 && index < str.length) {\n" +
          "    let char = str[index];\n" +
          "  }";
      } else if (message.includes("Operands must be numbers")) {
        suggestion =
          "\nSuggestion: Convert operands to numbers if needed, e.g.:\n" +
          "  let result = Number(x) + Number(y);";
      } else if (message.includes("Operands must be numbers or strings")) {
        suggestion =
          "\nSuggestion: Ensure both operands are either numbers or strings, e.g.:\n" +
          "  let result = String(x) + String(y);";
      } else if (message.includes("Can only call functions and classes")) {
        suggestion =
          "\nSuggestion: Make sure the value is a function or class before calling, e.g.:\n" +
          '  if (typeof value === "function") {\n' +
          "    value();\n" +
          "  }";
      } else if (message.includes("is not a class")) {
        suggestion =
          "\nSuggestion: Make sure the value is a class before instantiating, e.g.:\n" +
          "  if (value instanceof ClouClass) {\n" +
          "    new value();\n" +
          "  }";
      } else if (message.includes("Invalid super call")) {
        suggestion =
          "\nSuggestion: super can only be used in a subclass constructor, e.g.:\n" +
          "  class SubClass extends SuperClass {\n" +
          "    function init() {\n" +
          "      super.init();\n" +
          "    }\n" +
          "  }";
      } else if (
        message.includes("Only instances and objects have properties")
      ) {
        suggestion =
          "\nSuggestion: Make sure the value is an object before accessing properties, e.g.:\n" +
          '  if (typeof value === "object" && value !== null) {\n' +
          "    value.property;\n" +
          "  }";
      }

      this.message = `Runtime Error: ${message}\n\n${context}${suggestion}`;
    } else {
      this.message = `Runtime Error: ${message}`;
    }
  }
}

export class ReturnError extends Error {
  constructor(public value: ValueType) {
    super("");
    this.name = "Return";
  }
}

// Function representation
export class ClouFunction {
  constructor(
    public declaration: AST.Function,
    public closure: Environment,
    public isInitializer = false,
    public boundThis: ClouInstance | null = null
  ) {}

  bind(instance: ClouInstance): ClouFunction {
    return new ClouFunction(
      this.declaration,
      this.closure,
      this.isInitializer,
      instance
    );
  }

  call(interpreter: Interpreter, args: ValueType[]): ValueType {
    const environment = new Environment(this.closure);

    // If this function is bound to an instance, define 'this' in the environment
    if (this.boundThis) {
      environment.define("this", this.boundThis);
    }

    for (let i = 0; i < this.declaration.params.length; i++) {
      const param = this.declaration.params[i];
      if (!param) continue;

      // If this is the rest parameter, collect all remaining arguments
      if (this.declaration.restParam && param === this.declaration.restParam) {
        const restArgs: ValueType[] = args.slice(i);
        environment.define(param.lexeme, restArgs);
        break;
      }

      let value: ValueType = i < args.length ? args[i] ?? null : null;
      const defaultExpr = this.declaration.defaults[i];
      if (value === null && defaultExpr) {
        value = interpreter.evaluate(defaultExpr);
      }
      environment.define(param.lexeme, value);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (e) {
      if (e instanceof ReturnError) {
        if (this.isInitializer) {
          return this.boundThis;
        }
        return e.value;
      }
      throw e;
    }

    if (this.isInitializer) {
      return this.boundThis;
    }

    return null;
  }
}

// Class representation
export class ClouClass {
  private properties: Map<string, ValueType>;

  constructor(
    public name: string,
    public superclass: ClouClass | null,
    public methods: Map<string, ClouFunction>
  ) {
    this.properties = new Map();
  }

  findMethod(name: string): ClouFunction | null {
    const method = this.methods.get(name);
    if (method) {
      return method;
    }

    if (this.superclass) {
      return this.superclass.findMethod(name);
    }

    return null;
  }

  setProperty(name: string, value: ValueType): void {
    this.properties.set(name, value);
  }

  getProperty(name: string): ValueType | null {
    const value = this.properties.get(name);
    if (value !== undefined) {
      return value;
    }

    if (this.superclass) {
      return this.superclass.getProperty(name);
    }

    return null;
  }

  toString(): string {
    return `<class ${this.name}>`;
  }
}

// Instance of a class
export class ClouInstance {
  private hiddenClass: IHiddenClass;
  private properties: ValueType[];
  private propertyCache: Map<string, number>;

  constructor(public klass: ClouClass) {
    this.hiddenClass = new HiddenClass();
    this.properties = [];
    this.propertyCache = new Map();
  }

  get(name: Token): ValueType {
    const propertyName = name.lexeme;

    // Check property cache first
    const cachedIndex = this.propertyCache.get(propertyName);
    if (cachedIndex !== undefined) {
      return this.properties[cachedIndex] ?? null;
    }

    // Check hidden class for property index
    const index = this.hiddenClass.getPropertyIndex(propertyName);
    if (index !== undefined) {
      // Cache the index for future lookups
      this.propertyCache.set(propertyName, index);
      return this.properties[index] ?? null;
    }

    // Check for class properties
    const classProperty = this.klass.getProperty(propertyName);
    if (classProperty !== null) {
      return classProperty;
    }

    // Check for methods
    const method = this.klass.findMethod(propertyName);
    if (method) {
      return method.bind(this);
    }

    throw new RuntimeError(
      `Undefined property '${propertyName}' in ${this.klass.name}.`
    );
  }

  set(name: Token | string, value: ValueType): void {
    const propertyName = typeof name === "string" ? name : name.lexeme;

    // Check property cache first
    const cachedIndex = this.propertyCache.get(propertyName);
    if (cachedIndex !== undefined) {
      this.properties[cachedIndex] = value;
      return;
    }

    // Check hidden class for property index
    const index = this.hiddenClass.getPropertyIndex(propertyName);
    if (index !== undefined) {
      this.properties[index] = value;
      // Cache the index for future lookups
      this.propertyCache.set(propertyName, index);
      return;
    }

    // Check if it's a class property
    if (this.klass.getProperty(propertyName) !== null) {
      this.klass.setProperty(propertyName, value);
      return;
    }

    // New property - transition to new hidden class
    this.hiddenClass = this.hiddenClass.addProperty(propertyName);
    const newIndex = this.hiddenClass.getPropertyIndex(propertyName);
    if (newIndex === undefined) {
      throw new RuntimeError(`Failed to add property '${propertyName}'`);
    }
    this.properties[newIndex] = value;
    // Cache the index for future lookups
    this.propertyCache.set(propertyName, newIndex);
  }

  toString(): string {
    return `<${this.klass.name} instance>`;
  }
}

interface EnvironmentVariable {
  value: ValueType;
  isConst: boolean;
}

export class Environment {
  private values = new Map<string, EnvironmentVariable>();
  readonly parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: ValueType, isConst = false): void {
    this.values.set(name, { value, isConst });
  }

  get(name: Token): ValueType {
    const variable = this.values.get(name.lexeme);
    if (variable) {
      return variable.value;
    }

    if (this.parent) {
      return this.parent.get(name);
    }

    throw new RuntimeError(`Undefined variable '${name.lexeme}'.`, name);
  }

  assign(name: Token, value: ValueType): void {
    const variable = this.values.get(name.lexeme);
    if (variable) {
      if (variable.isConst) {
        throw new RuntimeError(
          `Cannot reassign const variable '${name.lexeme}'.`,
          name
        );
      }
      variable.value = value;
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }

    throw new RuntimeError(`Undefined variable '${name.lexeme}'.`, name);
  }

  hasVariable(name: Token): boolean {
    if (this.values.has(name.lexeme)) {
      return true;
    }
    if (this.parent !== null) {
      return this.parent.hasVariable(name);
    }
    return false;
  }
}

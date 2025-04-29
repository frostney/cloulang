import type { Interpreter } from "./interpreter";
import type { Token } from "./token-types";
import type * as AST from "./ast-nodes";

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
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
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
  constructor(
    public name: string,
    public superclass: ClouClass | null,
    public methods: Map<string, ClouFunction>
  ) {}

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

  toString(): string {
    return `<class ${this.name}>`;
  }
}

// Instance of a class
export class ClouInstance {
  private fields = new Map<string, ValueType>();

  constructor(public klass: ClouClass) {}

  get(name: Token): ValueType {
    const fieldValue = this.fields.get(name.lexeme);
    if (fieldValue !== undefined) {
      return fieldValue;
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method) {
      return method.bind(this);
    }

    throw new RuntimeError(`Undefined property '${name.lexeme}'.`);
  }

  set(name: Token | string, value: ValueType): void {
    const propertyName = typeof name === "string" ? name : name.lexeme;
    this.fields.set(propertyName, value);
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

    throw new RuntimeError(`Undefined variable '${name.lexeme}'.`);
  }

  assign(name: Token, value: ValueType): void {
    const variable = this.values.get(name.lexeme);
    if (variable) {
      if (variable.isConst) {
        throw new RuntimeError(
          `Cannot reassign const variable '${name.lexeme}'.`
        );
      }
      variable.value = value;
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }

    throw new RuntimeError(`Undefined variable '${name.lexeme}'.`);
  }
}

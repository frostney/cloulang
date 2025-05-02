import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { ModuleSystem } from "./module-system";
import type { ValueType } from "./environment";

export class Clou {
  private interpreter: Interpreter;
  private hadError = false;
  private hadRuntimeError = false;

  constructor(moduleSystem?: ModuleSystem) {
    this.interpreter = new Interpreter(moduleSystem);
  }

  // Run a file by reading it from the filesystem
  runFile(filePath: string): void {
    const source = this.interpreter.moduleSystem.getFile(filePath);
    if (!source) {
      throw new Error(`File not found: ${filePath}`);
    }
    this.run(source);

    if (this.hadError) {
      // Exit with error status in a real implementation
      console.error("Execution failed due to errors.");
    }
    if (this.hadRuntimeError) {
      // Exit with runtime error status in a real implementation
      console.error("Execution failed due to runtime errors.");
    }
  }

  // Run from a REPL
  runPrompt(source: string): ValueType {
    const result = this.run(source);
    this.hadError = false;
    this.hadRuntimeError = false;
    return result;
  }

  private run(source: string): ValueType[] {
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();

    const parser = new Parser(tokens, source);
    const statements = parser.parse();

    if (this.hadError) {
      throw new Error("Execution failed due to errors.");
    }

    return this.interpreter.interpret(statements, source);
  }

  // Error handling methods
  error(line: number, message: string): void {
    this.report(line, "", message);
  }

  runtimeError(error: Error): void {
    console.error(`Runtime Error: ${error.message}`);
    this.hadRuntimeError = true;
  }

  private report(line: number, where: string, message: string): void {
    console.error(`[line ${line.toString()}] Error${where}: ${message}`);
    this.hadError = true;
  }
}

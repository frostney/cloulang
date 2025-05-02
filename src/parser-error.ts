import type { Token } from "./token-types";

export class ParserError extends Error {
  constructor(message: string, public token: Token, public source: string) {
    super(message);
    this.name = "ParserError";

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
    if (message.includes("Expect class name")) {
      suggestion =
        "\nSuggestion: Class names must be valid identifiers, e.g.:\n" +
        "  class MyClass { ... }";
    } else if (message.includes("Expect variable name")) {
      suggestion =
        "\nSuggestion: Variable names must be valid identifiers, e.g.:\n" +
        "  let myVar = value;";
    } else if (message.includes("Expect '(' after")) {
      suggestion =
        "\nSuggestion: Function calls and declarations require parentheses, e.g.:\n" +
        "  function myFunc() { ... }";
    } else if (message.includes("Expect ')' after")) {
      suggestion =
        "\nSuggestion: Close the parentheses, e.g.:\n" +
        "  function myFunc() { ... }";
    } else if (message.includes("Expect '{' before")) {
      suggestion =
        "\nSuggestion: Blocks require curly braces, e.g.:\n" +
        "  if (condition) { ... }";
    } else if (message.includes("Expect '}' after")) {
      suggestion =
        "\nSuggestion: Close the block with a curly brace, e.g.:\n" +
        "  if (condition) { ... }";
    } else if (message.includes("Expect ';' after")) {
      suggestion =
        "\nSuggestion: Statements must end with a semicolon, e.g.:\n" +
        "  let x = 5;";
    } else if (message.includes("Invalid assignment target")) {
      suggestion =
        "\nSuggestion: You can only assign to variables, properties, or array elements, e.g.:\n" +
        "  x = 5;  // Valid\n" +
        "  obj.prop = 5;  // Valid\n" +
        "  arr[0] = 5;  // Valid";
    } else if (message.includes("Can't have more than 255")) {
      suggestion =
        "\nSuggestion: Consider refactoring to use fewer parameters/arguments, e.g.:\n" +
        "  // Instead of many parameters\n" +
        "  function f(a, b, c, ...) { ... }\n" +
        "  // Use an object\n" +
        "  function f(options) { ... }";
    }

    this.message = `Parser Error: ${message}\n\n${context}${suggestion}`;
  }
}

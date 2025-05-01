import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Error Handling Tests", () => {
  test("undefined variable", () => {
    const code = `
      print(x); // x is not defined
    `;
    expect(() => runClouCode(code)).toThrow("Undefined variable 'x'");
  });

  test("division by zero", () => {
    const code = `
      let x = 10;
      let y = 0;
      let z = x / y;
      print(z);
    `;
    expect(() => runClouCode(code)).toThrow("Division by zero");
  });

  test("const reassignment", () => {
    const code = `
      const x = 10;
      x = 20;
      print(x);
    `;
    expect(() => runClouCode(code)).toThrow(
      "Cannot reassign const variable 'x'"
    );
  });

  test("invalid array index", () => {
    const code = `
      let arr = [1, 2, 3];
      print(arr[10]); // Index out of bounds
    `;
    expect(() => runClouCode(code)).toThrow("Array index out of bounds");
  });

  test("syntax error", () => {
    const code = `
      let x = 10
      print(x); // Missing semicolon
    `;
    expect(() => runClouCode(code)).toThrow(
      "Expect ';' after variable declaration"
    );
  });

  test("invalid function call", () => {
    const code = `
      let x = 10;
      x(); // x is not a function
    `;
    expect(() => runClouCode(code)).toThrow(
      "Can only call functions and classes"
    );
  });

  test("invalid class instantiation", () => {
    const code = `
      let x = 10;
      new x(); // x is not a class
    `;
    expect(() => runClouCode(code)).toThrow("x is not a class");
  });

  test("invalid super call", () => {
    const code = `
      class Animal {
        function init(name) {
          this.name = name;
        }
      }
      
      let animal = new Animal("Dog");
      super.init("Cat"); // super can only be used in a subclass
    `;
    expect(() => runClouCode(code)).toThrow("Invalid super call");
  });
});

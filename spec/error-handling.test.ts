import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Error Handling Tests", () => {
  test("undefined variable", () => {
    const code = `
      print(x); // x is not defined
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Undefined variable 'x'");
  });

  test("type error in arithmetic", () => {
    const code = `
      let x = "hello";
      let y = x + 5;
      print(y);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("hello5"); // String concatenation works
  });

  test("division by zero", () => {
    const code = `
      let x = 10;
      let y = 0;
      let z = x / y;
      print(z);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Division by zero");
  });

  test("const reassignment", () => {
    const code = `
      const x = 10;
      x = 20;
      print(x);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Cannot reassign const variable 'x'");
  });

  test("invalid object property access", () => {
    const code = `
      let obj = { name: "Clou" };
      print(obj.age); // age property doesn't exist
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Undefined property 'age'");
  });

  test("invalid array index", () => {
    const code = `
      let arr = [1, 2, 3];
      print(arr[10]); // Index out of bounds
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Index out of bounds");
  });

  test("syntax error", () => {
    const code = `
      let x = 10
      print(x); // Missing semicolon
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Expect ';' after variable declaration");
  });

  test("invalid function call", () => {
    const code = `
      let x = 10;
      x(); // x is not a function
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Can only call functions and classes");
  });

  test("invalid class instantiation", () => {
    const code = `
      let x = 10;
      new x(); // x is not a class
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Can only call functions and classes");
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
    const output = runClouCode(code);
    expect(output[0]).toContain("Cannot use 'super' outside of a class");
  });
});

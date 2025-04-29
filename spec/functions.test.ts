import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Functions Tests", () => {
  test("function declaration and call", () => {
    const code = `
      function add(a, b) {
        return a + b;
      }
      let sum = add(5, 3);
      print("Sum:", sum);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Sum: 8"]);
  });

  test("function with default parameters", () => {
    const code = `
      function greet(name = "Guest") {
        print("Hello, " + name + "!");
      }
      greet();
      greet("Alice");
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Hello, Guest!", "Hello, Alice!"]);
  });

  test("function with rest parameters", () => {
    const code = `
      function rest(...args) {
        print("Received:", args);
      }
      rest(1, 2, 3, 4, 5);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Received: [1, 2, 3, 4, 5]"]);
  });

  test("anonymous function", () => {
    const code = `
      let multiply = function(a, b) {
        return a * b;
      };
      print("Product:", multiply(4, 3));
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Product: 12"]);
  });

  test("composing functions", () => {
    const code = `
        function f(x) {
          return x + 5;
        }
        function g(x) {
          return x * 10;
        }
        function compose(f, g, x) {
          return f(g(x));
        }
        let x = 1;
        let result = compose(f, g, x);
        print(result);
        print(f(g(x)));
      `;
    const output = runClouCode(code);
    expect(output).toEqual(["15", "15"]);
  });
});

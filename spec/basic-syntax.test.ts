import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Basic Syntax Tests", () => {
  test("variables and arithmetic", () => {
    const code = `
      let x = 10;
      const PI = 3.14159;
      let result = (5 + 3) * 2 / (1 + 1);
      print("Result:", result);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Result: 8"]);
  });

  test("string concatenation", () => {
    const code = `
      let name = "Clou";
      let greeting = "Hello, " + name + "!";
      print(greeting);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Hello, Clou!"]);
  });

  test("string and number concatenation", () => {
    const code = `
      let x = "hello";
      let y = x + 5;
      print(y);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["hello5"]);
  });

  test("conditionals", () => {
    const code = `
      let x = 10;
      if (x > 5) {
        print("x is greater than 5");
      } else {
        print("x is not greater than 5");
      }
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["x is greater than 5"]);
  });

  test("arrays", () => {
    const code = `
      let numbers = [1, 2, 3, 4, 5];
      print("Third number:", numbers[2]);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Third number: 3"]);
  });

  test("objects", () => {
    const code = `
      let person = {
        name: "John",
        age: 30,
        isStudent: false
      };
      print("Person's name:", person.name);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Person's name: John"]);
  });
});

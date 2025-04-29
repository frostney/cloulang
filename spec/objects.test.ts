import { describe, test, expect } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Objects", () => {
  test("object creation", () => {
    const code = `
      let obj = { name: "Clou", age: 1 };
      print(obj.name);
      print(obj.age);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Clou", "1"]);
  });

  test("object methods", () => {
    const code = `
      let obj = { name: "Clou", greet: function() { return "Hello, " + this.name + "!"; } };
      print(obj.greet());
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Hello, Clou!"]);
  });

  test("set property after creation", () => {
    const code = `
      let obj = { name: "Clou" };
      obj.age = 1;
      print(obj.age);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["1"]);
  });
});

import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Edge Cases Tests", () => {
  test("whitespace only", () => {
    const code = `   \n  \t  \r\n  `;
    const output = runClouCode(code);
    expect(output).toEqual([]);
  });

  test("comments only", () => {
    const code = `
      // This is a comment
      /* This is a multi-line
         comment */
    `;
    const output = runClouCode(code);
    expect(output).toEqual([]);
  });

  test("empty function", () => {
    const code = `
      function empty() {}
      empty();
    `;
    const output = runClouCode(code);
    expect(output).toEqual([]);
  });

  test("empty class", () => {
    const code = `
      class Empty {}
      let obj = new Empty();
      print(obj);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Empty instance");
  });

  test("empty array", () => {
    const code = `
      let arr = [];
      print("Array length:", len(arr));
      let x = arr[0];
      print("First element:", x);
    `;
    expect(() => runClouCode(code)).toThrow("Array index out of bounds.");
  });

  test("empty object", () => {
    const code = `
      let obj = {};
      print("Object:", obj);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Object: {}");
  });

  test("null values", () => {
    const code = `
      let x = null;
      print("x is null:", x == null);
      print("x is false:", x == false);
      print("x is 0:", x == 0);
      print("x is empty string:", x == "");
    `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "x is null: true",
      "x is false: false",
      "x is 0: false",
      "x is empty string: false",
    ]);
  });

  test("boolean values", () => {
    const code = `
      print("true == true:", true == true);
      print("true == false:", true == false);
      print("true == 1:", true == 1);
      print("false == 0:", false == 0);
    `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "true == true: true",
      "true == false: false",
      "true == 1: false",
      "false == 0: false",
    ]);
  });

  test("number edge cases", () => {
    const code = `
      print("0 == -0:", 0 == -0);
      let x = 1;
      let y = 0;
      let z = x / y;
      print("1/0:", z);
    `;
    expect(() => runClouCode(code)).toThrow("Division by zero.");
  });

  test("string edge cases", () => {
    const code = `
      print("Empty string:", "");
      print("String with spaces:", "   ");
      print("String with newlines:", "\\n\\t\\r");
      print("String with quotes:", '\\"Hello\\"');
      print("String with backslashes:", "\\\\n\\\\t");
    `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "Empty string: ",
      "String with spaces:    ",
      "String with newlines: \\n\\t\\r",
      'String with quotes: \\"Hello\\"',
      "String with backslashes: \\\\n\\\\t",
    ]);
  });

  test("array edge cases", () => {
    const code = `
      let arr = [1, 2, 3];
      let x = arr[-1];
      print("Negative index:", x);
    `;
    expect(() => runClouCode(code)).toThrow("Array index out of bounds.");
  });

  test("object edge cases", () => {
    const code = `
      let obj = { name: "Clou" };
      print("Non-existent property:", obj.age);
      obj.age = 1;
      print("Object after adding property:", obj);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Non-existent property: age");
    expect(output[1]).toContain(
      "Object after adding property: { name: Clou, age: 1 }"
    );
  });

  test("function edge cases", () => {
    const code = `
      function noReturn() {}
      print("Function with no return:", noReturn());
      
      function returnNull() {
        return null;
      }
      print("Function returning null:", returnNull());
      
      function returnUndefined() {
        return;
      }
      print("Function returning undefined:", returnUndefined());
    `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "Function with no return: null",
      "Function returning null: null",
      "Function returning undefined: null",
    ]);
  });

  test("class edge cases", () => {
    const code = `
      class Animal {
        function init(name) {
          this.name = name;
        }
      }
      
      let animal = new Animal();
      print("Animal without name:", animal);
      
      let dog = new Animal("Dog");
      print("Dog with name:", dog);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Animal instance");
    expect(output[1]).toContain("Dog");
  });
});

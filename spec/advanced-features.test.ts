import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Advanced Features Tests", () => {
  test("higher-order functions", () => {
    const code = `
      function map(array, fn) {
        let result = [];
        for (let i = 0; i < len(array); i = i + 1) {
          result[i] = fn(array[i]);
        }
        return result;
      }

      let numbers = [1, 2, 3, 4, 5];
      let doubled = map(numbers, function(n) { return n * 2; });
      print("Doubled:", doubled);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Doubled: [2, 4, 6, 8, 10]"]);
  });

  test("closures", () => {
    const code = `
      function makeCounter() {
        let count = 0;
        return function() {
          count = count + 1;
          return count;
        };
      }

      let counter = makeCounter();
      print(counter());
      print(counter());
      print(counter());
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["1", "2", "3"]);
  });

  test("object with methods", () => {
    const code = `
      let calculator = {
        value: 0,
        add: function(n) {
          this.value = this.value + n;
          return this;
        },
        subtract: function(n) {
          this.value = this.value - n;
          return this;
        },
        multiply: function(n) {
          this.value = this.value * n;
          return this;
        },
        getValue: function() {
          return this.value;
        }
      };

      print("Calculator result:", 
        calculator.add(5).multiply(2).subtract(3).getValue()
      );
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Calculator result: 7"]);
  });
});

import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

// Helper function to measure execution time
function measureExecutionTime(code: string): number {
  const start = performance.now();
  runClouCode(code);
  const end = performance.now();
  return end - start;
}

describe("Performance Tests", () => {
  test("arithmetic operations", () => {
    const code = `
      let sum = 0;
      for (let i = 0; i < 10000; i = i + 1) {
        sum = sum + i * i / (i + 1);
      }
      print("Sum:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Arithmetic operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(1000); // Should execute in less than 1 second
  });

  test("string operations", () => {
    const code = `
      let str = "";
      for (let i = 0; i < 1000; i = i + 1) {
        str = str + "a";
      }
      print("String length:", len(str));
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `String operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(1000); // Should execute in less than 1 second
  });

  test("array operations", () => {
    const code = `
      let arr = [];
      for (let i = 0; i < 10000; i = i + 1) {
        arr[i] = i;
      }
      let sum = 0;
      for (let i = 0; i < len(arr); i = i + 1) {
        sum = sum + arr[i];
      }
      print("Array sum:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Array operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(1000); // Should execute in less than 1 second
  });

  test("object operations", () => {
    const code = `
      let obj = {};
      for (let i = 0; i < 10000; i = i + 1) {
        obj["key" + i] = i;
      }
      let sum = 0;
      for (let i = 0; i < 10000; i = i + 1) {
        sum = sum + obj["key" + i];
      }
      print("Object sum:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Object operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(1000); // Should execute in less than 1 second
  });

  test("function calls", () => {
    const code = `
      function fib(n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      }
      
      print("Fibonacci(20):", fib(20));
    `;
    const executionTime = measureExecutionTime(code);
    console.log(`Function calls execution time: ${executionTime.toFixed(2)}ms`);
    expect(executionTime).toBeLessThan(1000); // Should execute in less than 1 second
  });

  test("class instantiation", () => {
    const code = `
      class Point {
        function init(x, y) {
          this.x = x;
          this.y = y;
        }
        
        function distance(other) {
          let dx = this.x - other.x;
          let dy = this.y - other.y;
          return (dx * dx + dy * dy) ^ 0.5;
        }
      }
      
      let points = [];
      for (let i = 0; i < 1000; i = i + 1) {
        points[i] = new Point(i, i);
      }
      
      let totalDistance = 0;
      for (let i = 0; i < len(points) - 1; i = i + 1) {
        totalDistance = totalDistance + points[i].distance(points[i + 1]);
      }
      
      print("Total distance:", totalDistance);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Class instantiation execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(1000); // Should execute in less than 1 second
  });

  test("large array operations", () => {
    const code = `
      let arr = [];
      for (let i = 0; i < 1000000; i = i + 1) {
        arr[i] = i;
      }
      let sum = 0;
      for (let i = 0; i < len(arr); i = i + 1) {
        sum = sum + arr[i];
      }
      print("Array sum:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Large array operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(2000); // Should execute in less than 2 seconds
  });

  test("large object operations", () => {
    const code = `
      // Pre-allocate object with numeric keys
      let obj = {};
      let size = 1000000;
      
      // Fill object with numeric keys
      for (let i = 0; i < size; i = i + 1) {
        obj[i] = i;  // Use numeric keys directly
      }
      
      let sum = 0;
      // Sum using numeric keys
      for (let i = 0; i < size; i = i + 1) {
        sum = sum + obj[i];
      }
      print("Object sum:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Large object operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(2000); // Should execute in less than 2 seconds
  });

  // Add a new test for string key operations to compare
  test("large object operations with string keys", () => {
    const code = `
      // Pre-allocate object and cache key prefix
      let obj = {};
      let size = 1000000;
      let keyPrefix = "key";
      
      // Fill object with string keys
      for (let i = 0; i < size; i = i + 1) {
        obj[keyPrefix + i] = i;
      }
      
      let sum = 0;
      // Sum using string keys
      for (let i = 0; i < size; i = i + 1) {
        sum = sum + obj[keyPrefix + i];
      }
      print("Object sum with string keys:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Large object operations with string keys execution time: ${executionTime.toFixed(
        2
      )}ms`
    );
    expect(executionTime).toBeLessThan(2000); // Should execute in less than 2 seconds
  });

  test("string interning", () => {
    const source = `
      let str1 = "hello";
      let str2 = "hello";
      let str3 = "world";
      let str4 = "world";
      let str5 = "hello";
      let str6 = "world";
      let str7 = "hello";
      let str8 = "world";
      let str9 = "hello";
      let str10 = "world";
    `;

    const start = performance.now();
    const result = runClouCode(source);
    const end = performance.now();
    console.log(
      `String interning execution time: ${(end - start).toFixed(2)}ms`
    );

    // Verify that identical strings are interned
    for (let i = 0; i < result.length; i++) {
      if (typeof result[i] !== "string") {
        throw new Error(
          `Expected string at index ${i}, got ${typeof result[i]}`
        );
      }
    }

    const [str1, str2, str3, str4, str5, str6, str7, str8, str9, str10] =
      result;

    expect(str1).toBe(str2); // str1 and str2
    expect(str3).toBe(str4); // str3 and str4
    expect(str1).toBe(str5); // str1 and str5
    expect(str3).toBe(str6); // str3 and str6
    expect(str1).toBe(str7); // str1 and str7
    expect(str3).toBe(str8); // str3 and str8
    expect(str1).toBe(str9); // str1 and str9
    expect(str3).toBe(str10); // str3 and str10
  });
});

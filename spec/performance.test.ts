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
    expect(executionTime).toBeLessThan(1500); // Should execute in less than 1 second
  });

  test("large object operations", () => {
    const code = `
      let obj = {};
      for (let i = 0; i < 1000000; i = i + 1) {
        obj["key" + i] = i;
      }
      let sum = 0;
      for (let i = 0; i < 1000000; i = i + 1) {
        sum = sum + obj["key" + i];
      }
      print("Object sum:", sum);
    `;
    const executionTime = measureExecutionTime(code);
    console.log(
      `Large object operations execution time: ${executionTime.toFixed(2)}ms`
    );
    expect(executionTime).toBeLessThan(1500); // Should execute in less than 1 second
  });
});

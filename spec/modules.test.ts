import { expect, test, describe } from "bun:test";
import { runClouCodeWithFiles } from "./test-utils";

describe("Module System Tests", () => {
  test("basic module loading", () => {
    const files = new Map<string, string>();

    files.set(
      "math.clou",
      `
      function add(a, b) {
        return a + b;
      }

      function subtract(a, b) {
        return a - b;
      }

      function multiply(a, b) {
        return a * b;
      }

      function divide(a, b) {
        if (b == 0) {
          print("Error: Division by zero");
          return null;
        }
        return a / b;
      }

      exports.add = add;
      exports.subtract = subtract;
      exports.multiply = multiply;
      exports.divide = divide;
    `
    );

    files.set(
      "main.clou",
      `
      const math = require("./math.clou");

      print("2 + 3 =", math.add(2, 3));
      print("5 - 2 =", math.subtract(5, 2));
      print("4 * 6 =", math.multiply(4, 6));
      print("10 / 2 =", math.divide(10, 2));
      print("10 / 0 =", math.divide(10, 0));
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual([
      "2 + 3 = 5",
      "5 - 2 = 3",
      "4 * 6 = 24",
      "10 / 2 = 5",
      "Error: Division by zero",
      "10 / 0 = null",
    ]);
  });

  test("nested module loading", () => {
    const files = new Map<string, string>();

    files.set(
      "utils/math.clou",
      `
      function add(a, b) {
        return a + b;
      }
      
      exports.add = add;
    `
    );

    files.set(
      "utils/string.clou",
      `
      function concat(a, b) {
        return a + b;
      }
      
      exports.concat = concat;
    `
    );

    files.set(
      "main.clou",
      `
      const math = require("./utils/math.clou");
      const string = require("./utils/string.clou");
      
      print("2 + 3 =", math.add(2, 3));
      print("Hello + World =", string.concat("Hello", "World"));
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual(["2 + 3 = 5", "Hello + World = HelloWorld"]);
  });

  test("circular dependencies", () => {
    const files = new Map<string, string>();

    files.set(
      "a.clou",
      `
      const b = require("./b.clou");
      
      function getValue() {
        return "A" + b.getValue();
      }
      
      exports.getValue = getValue;
    `
    );

    files.set(
      "b.clou",
      `
      const a = require("./a.clou");
      
      function getValue() {
        return "B" + a.getValue();
      }
      
      exports.getValue = getValue;
    `
    );

    files.set(
      "main.clou",
      `
      const a = require("./a.clou");
      
      print("Value:", a.getValue());
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual(["Value: AB"]);
  });

  test("module caching", () => {
    const files = new Map<string, string>();

    files.set(
      "counter.clou",
      `
      let count = 0;
      
      function increment() {
        count = count + 1;
        return count;
      }
      
      exports.increment = increment;
    `
    );

    files.set(
      "main.clou",
      `
      const counter1 = require("./counter.clou");
      const counter2 = require("./counter.clou");
      
      print("Counter 1:", counter1.increment());
      print("Counter 2:", counter2.increment());
      print("Counter 1 again:", counter1.increment());
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    // Both modules should share the same state
    expect(output).toEqual([
      "Counter 1: 1",
      "Counter 2: 2",
      "Counter 1 again: 3",
    ]);
  });

  test("module with classes", () => {
    const files = new Map<string, string>();

    files.set(
      "person.clou",
      `
      class Person {
        function init(name, age) {
          this.name = name;
          this.age = age;
        }
        
        function greet() {
          return "Hello, my name is " + this.name + " and I am " + this.age + " years old.";
        }
      }
      
      exports.Person = Person;
    `
    );

    files.set(
      "main.clou",
      `
      const Person = require("./person.clou").Person;
      
      let person = new Person("Alice", 30);
      print(person.greet());
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual(["Hello, my name is Alice and I am 30 years old."]);
  });

  test("module with inheritance", () => {
    const files = new Map<string, string>();

    files.set(
      "animal.clou",
      `
      class Animal {
        function init(name) {
          this.name = name;
        }
        
        function speak() {
          print(this.name + " makes a noise");
        }
      }
      
      exports.Animal = Animal;
    `
    );

    files.set(
      "dog.clou",
      `
      const Animal = require("./animal.clou").Animal;
      
      class Dog extends Animal {
        function init(name, breed) {
          super.init(name);
          this.breed = breed;
        }
        
        function speak() {
          print(this.name + " barks");
        }
      }
      
      exports.Dog = Dog;
    `
    );

    files.set(
      "main.clou",
      `
      const Dog = require("./dog.clou").Dog;
      
      let dog = new Dog("Rex", "German Shepherd");
      dog.speak();
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual(["Rex barks"]);
  });

  test("module with multiple exports", () => {
    const files = new Map<string, string>();

    files.set(
      "math.clou",
      `
      function add(a, b) {
        return a + b;
      }
      
      function subtract(a, b) {
        return a - b;
      }
      
      function multiply(a, b) {
        return a * b;
      }
      
      function divide(a, b) {
        if (b == 0) {
          print("Error: Division by zero");
          return null;
        }
        return a / b;
      }
      
      exports.add = add;
      exports.subtract = subtract;
      exports.multiply = multiply;
      exports.divide = divide;
    `
    );

    files.set(
      "main.clou",
      `
      const math = require("./math.clou");
      
      print("2 + 3 =", math.add(2, 3));
      print("5 - 2 =", math.subtract(5, 2));
      print("4 * 6 =", math.multiply(4, 6));
      print("10 / 2 =", math.divide(10, 2));
      print("10 / 0 =", math.divide(10, 0));
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual([
      "2 + 3 = 5",
      "5 - 2 = 3",
      "4 * 6 = 24",
      "10 / 2 = 5",
      "Error: Division by zero",
      "10 / 0 = null",
    ]);
  });

  test("module with self-reference", () => {
    const files = new Map<string, string>();

    files.set(
      "self-ref.clou",
      `
      let self = require("./self-ref.clou");
      
      function getSelf() {
        return self;
      }
      
      exports.getSelf = getSelf;
    `
    );

    files.set(
      "main.clou",
      `
      const selfRef = require("./self-ref.clou");
      
      print("Self reference:", selfRef);
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output[0]).toContain("Self reference:");
  });
});

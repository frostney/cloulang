import { expect, test, describe } from "bun:test";
import { runClouCode, runClouCodeWithFiles } from "./test-utils";

describe("Integration Tests", () => {
  test("functions with classes", () => {
    const code = `
      function createPerson(name, age) {
        return new Person(name, age);
      }
      
      class Person {
        function init(name, age) {
          this.name = name;
          this.age = age;
        }
        
        function greet() {
          return "Hello, my name is " + this.name + " and I am " + this.age + " years old.";
        }
      }
      
      let person = createPerson("Alice", 30);
      print(person.greet());
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Hello, my name is Alice and I am 30 years old."]);
  });

  test("classes with arrays", () => {
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
      for (let i = 0; i < 5; i = i + 1) {
        points[i] = new Point(i, i * 2);
      }
      
      let totalDistance = 0;
      for (let i = 0; i < len(points) - 1; i = i + 1) {
        totalDistance = totalDistance + points[i].distance(points[i + 1]);
      }
      
      print("Total distance:", totalDistance);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Total distance:");
  });

  test("functions with objects", () => {
    const code = `
      function createCounter() {
        return {
          count: 0,
          increment: function() {
            this.count = this.count + 1;
            return this.count;
          },
          decrement: function() {
            this.count = this.count - 1;
            return this.count;
          },
          getCount: function() {
            return this.count;
          }
        };
      }
      
      let counter = createCounter();
      print("Initial count:", counter.getCount());
      print("After increment:", counter.increment());
      print("After increment:", counter.increment());
      print("After decrement:", counter.decrement());
    `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "Initial count: 0",
      "After increment: 1",
      "After increment: 2",
      "After decrement: 1",
    ]);
  });

  test("classes with inheritance and modules", () => {
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
        
        function describe() {
          print(this.name + " is a " + this.breed);
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
      dog.describe();
    `
    );

    const output = runClouCodeWithFiles(files, "main.clou");
    expect(output).toEqual(["Rex barks", "Rex is a German Shepherd"]);
  });

  test("closures with classes", () => {
    const code = `
      function createPerson(name) {
        let age = 0;
        
        return new Person(name, function() {
          return age;
        }, function(newAge) {
          age = newAge;
        });
      }
      
      class Person {
        function init(name, getAge, setAge) {
          this.name = name;
          this.getAge = getAge;
          this.setAge = setAge;
        }
        
        function greet() {
          return "Hello, my name is " + this.name + " and I am " + this.getAge() + " years old.";
        }
      }
      
      let person = createPerson("Bob");
      print("Initial age:", person.getAge());
      person.setAge(25);
      print("After setting age:", person.getAge());
      print(person.greet());
    `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "Initial age: 0",
      "After setting age: 25",
      "Hello, my name is Bob and I am 25 years old.",
    ]);
  });

  test("arrays with objects and functions", () => {
    const code = `
      function filter(array, predicate) {
        let result = [];
        for (let i = 0; i < len(array); i = i + 1) {
          if (predicate(array[i])) {
            result[len(result)] = array[i];
          }
        }
        return result;
      }
      
      function map(array, fn) {
        let result = [];
        for (let i = 0; i < len(array); i = i + 1) {
          result[i] = fn(array[i]);
        }
        return result;
      }
      
      let people = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35 }
      ];
      
      let adults = filter(people, function(person) {
        return person.age >= 30;
      });
      
      let names = map(adults, function(person) {
        return person.name;
      });
      
      print("Adults:", adults);
      print("Names:", names);
    `;
    const output = runClouCode(code);
    expect(output[0]).toContain("Alice");
    expect(output[0]).toContain("Charlie");
    expect(output[1]).toContain("Alice");
    expect(output[1]).toContain("Charlie");
  });

  test("complex class hierarchy with methods", () => {
    const code = `
      class Shape {
        function init() {}
        
        function area() {
          return 0;
        }
        
        function perimeter() {
          return 0;
        }
        
        function describe() {
          return "A shape with area " + this.area().toFixed(5) + " and perimeter " + this.perimeter().toFixed(5);
        }
      }
      
      class Rectangle extends Shape {
        function init(width, height) {
          this.width = width;
          this.height = height;
        }
        
        function area() {
          return this.width * this.height;
        }
        
        function perimeter() {
          return 2 * (this.width + this.height);
        }
      }
      
      class Circle extends Shape {
        function init(radius) {
          this.radius = radius;
        }
        
        function area() {
          return 3.14159 * this.radius * this.radius;
        }
        
        function perimeter() {
          return 2 * 3.14159 * this.radius;
        }
      }
      
      let shapes = [
        new Rectangle(5, 10),
        new Circle(3),
        new Rectangle(2, 4)
      ];
      
      for (let i = 0; i < len(shapes); i = i + 1) {
        print(shapes[i].describe());
      }
    `;
    const output = runClouCode(code);
    expect(output.length).toBe(3);
    expect(output[0]).toContain("area 50");
    expect(output[1]).toContain("area 28.27431");
    expect(output[2]).toContain("area 8");
  });
});

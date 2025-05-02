import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Classes and Inheritance Tests", () => {
  test("basic class", () => {
    const code = `
      class Animal {
        function init(name) {
          this.name = name;
        }
        
        function speak() {
          print(this.name + " makes a noise");
        }
      }

      let animal = new Animal("Generic Animal");
      animal.speak();
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Generic Animal makes a noise"]);
  });

  test("class inheritance", () => {
    const code = `
      class Animal {
        function init(name) {
          this.name = name;
        }
        
        function speak() {
          print(this.name + " makes a noise");
        }
      }

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

      let dog = new Dog("Rex", "German Shepherd");
      dog.speak();
      dog.describe();
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Rex barks", "Rex is a German Shepherd"]);
  });

  test("class properties", () => {
    const code = `
      class Person {
        property name = "John";
        property age = 30;
      }

      let person = new Person();
      print(person.name);
      print(person.age);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["John", "30"]);
  });

  test("class properties with inheritance", () => {
    const code = `
      class Animal {
        property name = "Generic Animal";
      }

      class Dog extends Animal {
        property breed = "Labrador";
      }

      let dog = new Dog();
      print(dog.name);
      print(dog.breed);
    `;

    const output = runClouCode(code);
    expect(output).toEqual(["Generic Animal", "Labrador"]);
  });

  test("class properties can be changed", () => {
    const code = `
      class Person {
        property name = "John";
        property age = 30;

        function changeName(newName) {
          this.name = newName;
        }
      }

      let person = new Person();
      print(person.name);
      person.changeName("Jane");
      print(person.name);
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["John", "Jane"]);
  });

  test("deep class inheritance", () => {
    const code = `
      class Animal {
        function init(name) {
          this.name = name;
        }
        
        function speak() {
          print(this.name + " makes a noise");
        }
      }
      
      class Dog extends Animal {
        function init(name, breed) {
          super.init(name);
          this.breed = breed;
        }
      }

      class Labrador extends Dog {
        function init(name) {
          super.init(name, "Labrador");
        }
      }

      let lab = new Labrador("Buddy");
      lab.speak();
    `;
    const output = runClouCode(code);
    expect(output).toEqual(["Buddy makes a noise"]);
  });
});

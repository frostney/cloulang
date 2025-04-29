# Clou Programming Language

Clou is a dynamically-typed scripting language that combines Lua's simplicity with C-style syntax, adding modern features like classes and a module system.

## Language Features

- **C-style Syntax**: Uses braces, semicolons, and C-style comments
- **Classes and Inheritance**: Full support for classes, methods, and inheritance
- **First-class Functions**: Functions as values, closures, and higher-order functions
- **Modern Variable Declarations**: `let` for variables and `const` for constants
- **Module System**: Named imports/exports with `require` and `exports`
- **Rich Data Structures**: Arrays, objects, and strings with convenient access methods
- **Control Flow**: If/else statements, while loops, and for loops

## Implementation

This TypeScript implementation consists of:

1. **Lexer**: Converts source code into tokens
2. **Parser**: Creates an abstract syntax tree (AST) from tokens
3. **Interpreter**: Executes the AST
4. **Runtime Environment**: Provides native functions and handles execution

## Example Code

### Basic Syntax

```clou
// Variable declarations
let x = 10;
const PI = 3.14159;

// Arithmetic
let result = (5 + 3) * 2 / (1 + 1);
print("Result:", result);  // Prints 8

// Conditionals
if (x > 5) {
  print("x is greater than 5");
} else {
  print("x is not greater than 5");
}

// Arrays and objects
let numbers = [1, 2, 3, 4, 5];
let person = { name: "John", age: 30 };
```

### Functions

```clou
// Function declaration
function add(a, b) {
  return a + b;
}

// Function call
let sum = add(5, 3);

// Anonymous function
let multiply = function(a, b) {
  return a * b;
};
```

### Classes and Inheritance

```clou
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
}

let dog = new Dog("Rex", "German Shepherd");
dog.speak();  // Prints "Rex barks"
```

### Module System

math.clou:

```clou
function add(a, b) {
  return a + b;
}

exports.add = add;
```

main.clou:

```clou
const math = require("./math.clou");
print(math.add(2, 3));  // Prints 5
```

## Syntax Comparison with Lua and JavaScript

| Feature      | Clou                                   | Lua                                         | JavaScript                             |
| ------------ | -------------------------------------- | ------------------------------------------- | -------------------------------------- |
| Variables    | `let x = 10;`<br>`const PI = 3.14;`    | `local x = 10`<br>`local PI = 3.14`         | `let x = 10;`<br>`const PI = 3.14;`    |
| Functions    | `function add(a, b) { return a + b; }` | `function add(a, b) return a + b end`       | `function add(a, b) { return a + b; }` |
| Conditionals | `if (x > 5) { ... } else { ... }`      | `if x > 5 then ... else ... end`            | `if (x > 5) { ... } else { ... }`      |
| Loops        | `while (i < 10) { ... }`               | `while i < 10 do ... end`                   | `while (i < 10) { ... }`               |
| Classes      | `class Person { ... }`                 | `Person = {}; Person.__index = Person`      | `class Person { ... }`                 |
| Modules      | `exports.add = add;`<br>`require()`    | `local M = {}`<br>`return M`<br>`require()` | `module.exports`<br>`require()`        |
| Comments     | `//` and `/* ... */`                   | `--` and `--[[ ... ]]`                      | `//` and `/* ... */`                   |

## Future Enhancements

- Error handling with try/catch
- More comprehensive standard library
- Better runtime performance
- Compiler to JavaScript or bytecode
- Package management system

## Running the Code

```typescript
import { Clou } from "./clou";

const clou = new Clou();
clou.runFile(`
  let message = "Hello, World!";
  print(message);
`);
```

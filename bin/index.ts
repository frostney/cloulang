import { Clou } from "../src";
import * as readline from "readline";

const clou = new Clou();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Welcome to Clou REPL!");
console.log('Type "exit" or press Ctrl+C to quit.');

function prompt() {
  rl.question("> ", (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    try {
      clou.runPrompt(input);
    } catch (error) {
      console.error("Error:", error);
    }

    prompt();
  });
}

prompt();

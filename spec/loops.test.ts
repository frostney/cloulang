import { expect, test, describe } from "bun:test";
import { runClouCode } from "./test-utils";

describe("Loops Tests", () => {
  test("while loop", () => {
    const code = `
          let i = 0;
          while (i < 3) {
            print("While iteration", i);
            i = i + 1;
          }
        `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "While iteration 0",
      "While iteration 1",
      "While iteration 2",
    ]);
  });

  test("for loop", () => {
    const code = `
          for (let j = 0; j < 3; j = j + 1) {
            print("For iteration", j);
          }
        `;
    const output = runClouCode(code);
    expect(output).toEqual([
      "For iteration 0",
      "For iteration 1",
      "For iteration 2",
    ]);
  });
});

import { Clou } from "../src";
import { ModuleSystem } from "../src/module-system";

type LogArgument =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | LogArgument[];

/**
 * Runs Clou code with multiple files and captures console output
 * @param files Map of file paths to their contents
 * @param entryPoint The main file to run
 * @returns Array of strings containing console output
 */
export function runClouCodeWithFiles(
  files: Map<string, string>,
  entryPoint: string
): string[] {
  const logs: string[] = [];
  const originalConsoleLog = console.log;

  // Override console.log to capture output
  console.log = (...args: LogArgument[]) => {
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join(" ");
    logs.push(message);
  };

  try {
    // Create a new module system and add all files to it
    const moduleSystem = new ModuleSystem();

    // Create a new Clou instance with our module system
    const clou = new Clou(moduleSystem);

    // Add all files to the module system
    for (const [path, content] of files.entries()) {
      moduleSystem.addFile(path, content);
    }

    clou.runFile(entryPoint);
    return logs;
  } finally {
    // Restore original console.log
    console.log = originalConsoleLog;
  }
}

/**
 * Runs Clou code and captures console output
 * @param code The Clou code to run
 * @returns Array of strings containing console output
 */
export function runClouCode(code: string): string[] {
  const files = new Map<string, string>();
  files.set("main.clou", code);
  return runClouCodeWithFiles(files, "main.clou");
}

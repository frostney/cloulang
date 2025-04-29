import { Environment } from "./environment";
import { join } from "path";
import type { ValueType } from "./environment";

// Module loading status
enum ModuleStatus {
  PENDING,
  LOADING,
  LOADED,
  ERROR,
}

// Module metadata
interface ModuleMetadata {
  status: ModuleStatus;
  environment: Environment | null;
  dependencies: Set<string>;
  error: Error | null;
  lastModified: number;
  requireCalls: Set<string>; // Track require calls for dependency analysis
}

// Module system interface
interface IModuleSystem {
  addFile(path: string, content: string): void;
  getFile(path: string): string | undefined;
  getModuleSource(path: string, currentDir?: string): string;
  getCachedModule(path: string): ValueType | undefined;
  cacheModule(path: string, exports: ValueType): void;
  clearCache(): void;
  resolvePath(path: string, currentDir: string): string;
  moduleExists(path: string): boolean;
}

export class ModuleSystem implements IModuleSystem {
  private modules = new Map<string, ModuleMetadata>();
  private files = new Map<string, string>();
  private moduleStack: string[] = [];
  private preloadedModules = new Set<string>();
  private requireCache = new Map<string, ValueType>(); // Cache for require results

  // Add a file to the virtual filesystem
  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  // Get a file from the virtual filesystem
  getFile(path: string): string | undefined {
    return this.files.get(path);
  }

  // Resolve a path relative to the current directory
  resolvePath(path: string, currentDir: string): string {
    // Normalize the path by removing any leading ./ or ../
    const normalizedPath = path.replace(/^\.\//, "").replace(/^\.\.\//, "");

    // If the path is already in our filesystem, return it
    if (this.files.has(normalizedPath)) {
      return normalizedPath;
    }

    // Try with .clou extension
    const withExtension = normalizedPath.endsWith(".clou")
      ? normalizedPath
      : `${normalizedPath}.clou`;
    if (this.files.has(withExtension)) {
      return withExtension;
    }

    // Try resolving relative to current directory
    const relativePath = join(currentDir, normalizedPath);
    if (this.files.has(relativePath)) {
      return relativePath;
    }

    // Try with .clou extension in current directory
    const relativeWithExtension = join(currentDir, withExtension);
    if (this.files.has(relativeWithExtension)) {
      return relativeWithExtension;
    }

    // If we still can't find it, return the original path
    // This will cause a more descriptive error when we try to read the file
    return normalizedPath;
  }

  // Add a helper method to check if a module exists
  moduleExists(path: string): boolean {
    return this.files.has(path);
  }

  // Get the source code for a module
  getModuleSource(path: string, currentDir = "."): string {
    const resolvedPath = this.resolvePath(path, currentDir);
    const source = this.files.get(resolvedPath);
    if (!source) {
      throw new Error(
        `Cannot find module '${path}' from '${currentDir}'\n` +
          `Resolved path: ${resolvedPath}\n` +
          `Available files: ${Array.from(this.files.keys()).join(", ")}`
      );
    }
    return source;
  }

  // Get a cached module from the require cache
  getCachedModule(path: string): ValueType | undefined {
    return this.requireCache.get(path);
  }

  // Cache a module's exports
  cacheModule(path: string, exports: ValueType): void {
    this.requireCache.set(path, exports);
  }

  // Clear the module cache
  clearCache(): void {
    this.modules.clear();
    this.preloadedModules.clear();
    this.requireCache.clear();
  }
}

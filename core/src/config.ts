import path from "path";
import fs from "fs";

export interface TranspilerConfig {
  typeMappings?: Record<string, string>;
  libraryMappings?: Record<string, string>;
  features?: {
    verbose?: boolean;
    formatOutput?: boolean;
  };
  strictMode?: boolean;
  verbose?: boolean;
  target?: string;
  moduleName?: string;
  packageName?: string;
  initializers?: Partial<Record<string, string>>;
  customTypes?: Record<string, string>;
}

export function loadTranspilerConfig(configPath?: string): TranspilerConfig {
  const fullPath = configPath
    ? path.resolve(configPath)
    : path.resolve("transpiler.config.json");

  if (fs.existsSync(fullPath)) {
    const data = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(data);
  }

  return {};
}

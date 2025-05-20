//export type TargetChain = "sui" | "aptos";

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

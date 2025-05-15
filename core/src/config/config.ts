export interface TranspilerConfig {
  typeMappings?: Record<string, string>;
  libraryMappings?: Record<string, string>;
  features?: {
    verbose?: boolean;
    formatOutput?: boolean;
  };
}

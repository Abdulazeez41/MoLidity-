import { ABIEntry, AstNode, StatementHelperFunctions } from "../types";

export interface TranspilerPlugin {
  name: string;

  // Hook into ABI parsing
  beforeParseABI?(rawABI: any[]): void;
  afterParseABI?(parsedABI: ABIEntry[]): ABIEntry[];

  // Hook into Move generation
  beforeGenerateMove?(contractName: string, abi: ABIEntry[]): void;
  afterGenerateMove?(moveCode: string): string;

  // Provide additional type mappings
  getTypeOverrides?(): Record<string, string>;

  // Provide additional library mappings
  getLibraryOverrides?(): Record<string, string>;

  // New: handle unsupported statements
  handleStatement?(
    stmt: AstNode,
    helpers: StatementHelperFunctions
  ): string | null;
}

import { ABIEntry } from "../types.js";
import { MoveStruct } from "../move/typeMapper.js";

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
}

import { ABIEntryForImport } from "../types";
export declare const solidityToMoveLibraryMap: Record<string, string>;
export declare function inferLibrariesFromABI(abi: ABIEntryForImport[]): string[];
export declare function generateUseStatements(libs: string[]): string[];

import { ABIEntry } from "../types.js";
export interface TranspilerPlugin {
    name: string;
    beforeParseABI?(rawABI: any[]): void;
    afterParseABI?(parsedABI: ABIEntry[]): ABIEntry[];
    beforeGenerateMove?(contractName: string, abi: ABIEntry[]): void;
    afterGenerateMove?(moveCode: string): string;
    getTypeOverrides?(): Record<string, string>;
    getLibraryOverrides?(): Record<string, string>;
}

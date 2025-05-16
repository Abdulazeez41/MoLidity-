import { ABIEntry, ParsedAbiResult, ParsedContract } from "../types";
export declare function generateMoveModule(name: string, abi: ABIEntry[], inferredLibs: string[], stateVariables: {
    name: string;
    type: string;
}[], options?: {
    verbose?: boolean;
    customTypes?: Record<string, string>;
}): string;
export declare function generateMove(parsed: ParsedAbiResult): string;
export declare function generateMoveFromParsedContract(parsed: ParsedContract[]): string;

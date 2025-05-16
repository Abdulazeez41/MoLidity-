import { ABIEntry } from "../types";
export type ParsedABI = {
    abi: ABIEntry[];
    stateVariables: {
        name: string;
        type: string;
    }[];
};
export declare function parseFullABI(filePath: string): ParsedABI;
export declare function getFunctionABIs(abi: ABIEntry[]): ABIEntry[];

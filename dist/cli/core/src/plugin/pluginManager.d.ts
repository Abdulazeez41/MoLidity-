import { ABIEntry } from "../types.js";
import { TranspilerPlugin } from "./plugin.js";
export declare class PluginManager {
    private plugins;
    addPlugin(plugin: TranspilerPlugin): void;
    runBeforeParseABI(rawABI: any[]): void;
    runAfterParseABI(parsedABI: ABIEntry[]): ABIEntry[];
    runBeforeGenerateMove(contractName: string, abi: ABIEntry[]): void;
    runAfterGenerateMove(moveCode: string): string;
    getAllTypeOverrides(): Record<string, string>;
    getAllLibraryOverrides(): Record<string, string>;
}

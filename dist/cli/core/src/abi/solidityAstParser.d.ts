import { ParsedContract } from "../types";
export declare class SolidityParser {
    private filePath;
    private source;
    private ast;
    constructor(filePath: string);
    private compileSource;
    parseContracts(): ParsedContract[];
    private extractStateVariables;
    private extractFunctions;
    private extractParameters;
    private extractFunctionBody;
}
export declare function parseSolidityFile(filePath: string): ParsedContract[];

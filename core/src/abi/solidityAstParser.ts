import * as fs from "fs";
import * as path from "path";
import * as solc from "solc";

import { ParsedContract } from "../types";

export class SolidityParser {
  private source: string = "";
  private ast: any;

  constructor(private filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.source = fs.readFileSync(filePath, "utf8");
    this.compileSource();
  }

  private compileSource() {
    const input = {
      language: "Solidity",
      sources: {
        [path.basename(this.filePath)]: {
          content: this.source,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
            "": ["ast"],
          },
        },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors?.length) {
      const fatal = output.errors.find((e: any) => e.severity === "error");
      if (fatal) throw new Error(fatal.formattedMessage);
    }

    this.ast = output.sources[Object.keys(output.sources)[0]].ast;
  }

  public parseContracts(): ParsedContract[] {
    const contracts: ParsedContract[] = [];

    const nodes = this.ast.nodes || [];
    for (const node of nodes) {
      if (node.nodeType !== "ContractDefinition") continue;

      const contractName = node.name;
      const stateVariables = this.extractStateVariables(node);
      const functions = this.extractFunctions(node);

      contracts.push({ contractName, stateVariables, functions });
    }

    return contracts;
  }

  private extractStateVariables(contractNode: any) {
    return (contractNode.nodes || [])
      .filter((n: any) => n.nodeType === "VariableDeclaration")
      .map((v: any) => ({
        name: v.name,
        type: v.typeDescriptions?.typeString || "unknown",
      }));
  }

  private extractFunctions(contractNode: any) {
    return (contractNode.nodes || [])
      .filter((n: any) => n.nodeType === "FunctionDefinition" && n.body)
      .map((f: any) => ({
        name: f.name || "(constructor/fallback/receive)",
        visibility: f.visibility,
        mutability: f.stateMutability,
        params: this.extractParameters(f.parameters),
        returns: this.extractParameters(f.returnParameters),
        body: this.extractFunctionBody(f.body),
      }));
  }

  private extractParameters(paramsNode: any): { name: string; type: string }[] {
    return (paramsNode?.parameters || []).map((p: any) => ({
      name: p.name,
      type: p.typeDescriptions?.typeString || "unknown",
    }));
  }

  private extractFunctionBody(bodyNode: any): string {
    // TODO: Replace with real logic later
    return "// BODY STUBBED";
  }
}
export function parseSolidityFile(filePath: string): ParsedContract[] {
  const parser = new SolidityParser(filePath);
  return parser.parseContracts();
}

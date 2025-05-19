import * as fs from "fs";
import * as path from "path";
import * as solc from "solc";

import { logger } from "../utils/logger";
import { PluginManager } from "../../src/plugin/pluginManager";
import {
  AstNode,
  Parameter,
  ParsedContract,
  StateVariable,
  StatementHelperFunctions,
  FunctionDefinition,
  EventDefinition,
  ModifierDefinition,
} from "../types";

export class SolidityParser {
  private source: string = "";
  private ast?: AstNode;

  constructor(
    private filePath: string,
    private strictMode: boolean = false,
    private pluginManager: PluginManager = new PluginManager()
  ) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    this.source = fs.readFileSync(filePath, "utf8");
    this.compileSource();
    if (!this.ast) {
      throw new Error("Failed to parse AST. Compilation may have failed.");
    }
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
      const fatalErrors = output.errors.filter(
        (e: any) => e.severity === "error"
      );
      if (fatalErrors.length > 0) {
        throw new Error(
          `Compilation failed:\n${fatalErrors
            .map((e: any) => e.formattedMessage)
            .join("\n")}`
        );
      }
    }

    this.ast = output.sources[Object.keys(output.sources)[0]].ast;
  }

  public parseContracts(): ParsedContract[] {
    if (!this.ast) {
      throw new Error("AST not available for parsing contracts.");
    }

    const contracts: ParsedContract[] = [];

    for (const node of this.ast.nodes || []) {
      if (node.nodeType !== "ContractDefinition") continue;

      const contractName = node.name;
      const baseContracts = this.extractBaseContracts(node);
      const stateVariables = this.extractStateVariables(node);
      const functions = this.extractFunctions(node);
      const events = this.extractEvents(node);
      const modifiers = this.extractModifiers(node);

      contracts.push({
        contractName,
        baseContracts,
        stateVariables,
        functions,
        events,
        modifiers,
      });
    }

    return contracts;
  }

  private extractBaseContracts(contractNode: AstNode): string[] {
    return (
      contractNode.baseContracts?.map((base: AstNode) => base.baseName.name) ||
      []
    );
  }

  private extractStateVariables(contractNode: AstNode): StateVariable[] {
    return (contractNode.nodes || [])
      .filter(
        (n: AstNode) =>
          n.nodeType === "VariableDeclaration" &&
          !n.functionSelector &&
          n.visibility !== "internal" &&
          n.visibility !== "private"
      )
      .map((v: AstNode) => ({
        name: v.name,
        type: v.typeDescriptions?.typeString || "unknown",
        visibility: v.visibility || "public",
      }));
  }

  private extractEvents(contractNode: AstNode): EventDefinition[] {
    return (contractNode.nodes || [])
      .filter((n: AstNode) => n.nodeType === "EventDefinition")
      .map((e: AstNode) => ({
        name: e.name,
        params: e.parameters.parameters.map((p: AstNode) => ({
          name: p.name,
          type: p.typeDescriptions?.typeString || "unknown",
        })),
      }));
  }

  private extractModifiers(contractNode: AstNode): ModifierDefinition[] {
    return (contractNode.nodes || [])
      .filter((n: AstNode) => n.nodeType === "ModifierDefinition")
      .map((m: AstNode) => ({
        name: m.name,
      }));
  }

  private extractFunctions(contractNode: AstNode): FunctionDefinition[] {
    return (contractNode.nodes || [])
      .filter((n: AstNode) => n.nodeType === "FunctionDefinition" && n.body)
      .map((f: AstNode) => ({
        name: f.name || "(constructor/fallback/receive)",
        visibility: f.visibility,
        mutability: f.stateMutability,
        params: this.extractParameters(f.parameters),
        returns: this.extractParameters(f.returnParameters),
        body: this.extractFunctionBody(f.body),
        src: f.src,
      }));
  }

  private extractParameters(paramsNode: AstNode): Parameter[] {
    return (paramsNode?.parameters || []).map((p: AstNode) => ({
      name: p.name,
      type: p.typeDescriptions?.typeString || "unknown",
    }));
  }

  private extractFunctionBody(bodyNode: AstNode): string {
    return this.walkStatements(bodyNode.statements || []);
  }

  private walkStatements(statements: AstNode[]): string {
    const helpers: StatementHelperFunctions = {
      walkStatements: this.walkStatements.bind(this),
      walkExpression: this.walkExpression.bind(this),
    };

    return statements
      .map((stmt) => {
        const pluginResult = this.pluginManager.runCustomStatementHandler(
          stmt,
          helpers
        );
        if (pluginResult !== null) {
          return pluginResult;
        }

        switch (stmt.nodeType) {
          case "ExpressionStatement":
            return `${this.walkExpression(stmt.expression)};`;
          case "IfStatement":
            return `if (${this.walkExpression(stmt.condition)}) {
  ${this.walkStatements(stmt.thenBranch?.statements || [])}
  }${
    stmt.elseBranch
      ? ` else {
  ${this.walkStatements(stmt.elseBranch.statements || [])}
  }`
      : ""
  }`;
          case "Return":
            return `return ${this.walkExpression(stmt.expression)};`;
          case "VariableDeclarationStatement":
            return `${stmt.declarations
              .map((d: any) => d.name)
              .join(", ")} = ${this.walkExpression(stmt.initialValue)};`;
          default:
            const msg = `[UNSUPPORTED STATEMENT: ${stmt.nodeType}]`;
            if (this.strictMode) {
              throw new Error(msg);
            } else {
              logger.warn(msg);
              return `// ${msg}`;
            }
        }
      })
      .join("\n");
  }

  private walkExpression(expr: AstNode): string {
    if (!expr) return "";

    switch (expr.nodeType) {
      case "Identifier":
        return expr.name;
      case "Literal":
        return expr.value;
      case "BinaryOperation":
        return `${this.walkExpression(expr.leftExpression)} ${
          expr.operator
        } ${this.walkExpression(expr.rightExpression)}`;
      case "FunctionCall":
        return `${this.walkExpression(expr.expression)}(${expr.arguments
          .map((arg: AstNode) => this.walkExpression(arg))
          .join(", ")})`;
      default:
        return `[EXPR:${expr.nodeType}]`;
    }
  }
}

export function parseSolidityFile(
  filePath: string,
  strictMode: boolean = false,
  pluginManager: PluginManager = new PluginManager()
): ParsedContract[] {
  const parser = new SolidityParser(filePath, strictMode, pluginManager);
  return parser.parseContracts();
}

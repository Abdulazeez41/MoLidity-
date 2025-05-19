import { mapSolidityTypeToMove, getDefaultInitialValue } from "./typeMapper";
import { MoveTarget, TARGET_MAP, getMoveTarget } from "./targetMapper";
import { generateUseStatements } from "./importMapper";
import { TranspilerConfig } from "../config";
import {
  Param,
  ModuleNode,
  StructNode,
  FunctionNode,
  UseStatement,
  StatementNode,
  createModuleNode,
} from "./ast";
import {
  generateFunctionBody,
  GeneratedFunctionBody,
} from "./generators/functionGenerator";
import { generateEventStruct } from "./generators/eventGenerator";
import { parseMappingType } from "./generators/mappingGenerator";
import { generateCustomErrorStruct } from "./generators/errorGenerator";
import { ABIEntry, ParsedAbiResult, ParsedContract } from "../types";
import { formatStruct, sanitizeIdentifier } from "../utils/utils";
import { logger } from "../utils/logger";

export function generateMoveModule(
  name: string,
  abi: ABIEntry[],
  inferredLibs: string[],
  stateVariables: { name: string; type: string }[],
  options: TranspilerConfig & {
    target?: "sui" | "aptos";
    verbose?: boolean;
  } = {}
): string {
  const {
    verbose = false,
    moduleName: userModuleName = name,
    packageName: userPackageName = "my_contract",
    customTypes = {},
  } = options;

  const targetName = options.target || "sui";
  const moveTarget = getMoveTarget(targetName);
  const moduleName = sanitizeIdentifier(userModuleName);
  const packageName = sanitizeIdentifier(userPackageName);

  const moduleAst = createModuleNode();
  moduleAst.name = moduleName;
  moduleAst.packageName = packageName;

  moduleAst.uses = moveTarget.useStatements.map((stmt) => ({
    type: "use",
    path: stmt,
  }));

  const useStatements = generateUseStatements(inferredLibs, moveTarget);
  if (useStatements.length > 0) {
    useStatements.forEach((stmt) =>
      moduleAst.uses.push({ type: "use", path: stmt })
    );
  }

  const structDefs = new Map<string, StructNode>();
  const functionDefs: FunctionNode[] = [];

  abi
    .filter((entry) => entry.type === "event")
    .forEach((entry) => {
      const eventStruct = generateEventStructNode(entry);
      if (!structDefs.has(eventStruct.name)) {
        structDefs.set(eventStruct.name, eventStruct);
      }
    });

  abi
    .filter((entry) => entry.type === "error")
    .forEach((entry) => {
      const fields = (entry.inputs || []).map((param, i) => ({
        name: sanitizeIdentifier(param.name || `arg${i}`),
        type: mapSolidityTypeToMove(param.type).moveType,
      }));
      const errorStruct = generateCustomErrorStructNode(entry.name!, fields);
      if (!structDefs.has(errorStruct.name)) {
        structDefs.set(errorStruct.name, errorStruct);
      }
    });

  const stateStruct = buildMoveStateStructNode(
    moduleName,
    stateVariables,
    moveTarget
  );
  moduleAst.structs.push(stateStruct);

  const initFn = generateInitFunctionNode(
    moduleName,
    stateVariables,
    moveTarget
  );
  moduleAst.functions.push(initFn);

  abi
    .filter((entry) => entry.type === "function")
    .forEach((entry) => {
      try {
        const fnNode = generateFunctionNode(entry, {
          contractName: moduleName,
          customTypes,
          moveTarget,
        });
        functionDefs.push(fnNode);
      } catch (e) {
        logger.error(`Failed to generate function: ${entry.name}`);
        throw e;
      }
    });

  moduleAst.structs.push(...Array.from(structDefs.values()));

  moduleAst.functions.push(...functionDefs);

  return printMoveModule(moduleAst, moveTarget);
}

export function generateMove(parsed: ParsedAbiResult): string {
  logger.info("Generating Move module from parsed ABI");
  return generateMoveModule(
    parsed.stateVariables[0]?.name || "MyContract",
    parsed.abi,
    [],
    parsed.stateVariables
  );
}

export function generateMoveFromParsedContract(
  parsed: ParsedContract[]
): string {
  if (!parsed.length)
    throw new Error("No contracts found in parsed Solidity file");

  const contract = parsed[0];
  logger.info(`Generating Move module for contract: ${contract.contractName}`);

  const abiEntries = contract.functions.map((fn) => ({
    type: "function" as const,
    name: fn.name,
    inputs: fn.params.map((p) => ({ name: p.name, type: p.type })),
    outputs: fn.returns.map((r) => ({ name: r.name, type: r.type })),
    stateMutability: fn.mutability,
  }));

  return generateMoveModule(
    contract.contractName,
    abiEntries,
    [],
    contract.stateVariables
  );
}

function generateInitFunctionNode(
  contractName: string,
  stateVariables: { name: string; type: string }[],
  moveTarget: MoveTarget
): FunctionNode {
  const body: StatementNode[] = [];
  const params = [{ name: "ctx", type: "&mut TxContext" }];

  body.push({
    type: "statement",
    content: `${moveTarget.transferInit}(${contractName} {`,
  });

  if (moveTarget === TARGET_MAP.sui) {
    body.push({
      type: "statement",
      content: "  id: object::new(ctx),",
    });
    body.push({
      type: "statement",
      content: "  owner: tx_context::sender(ctx),",
    });
  } else {
    body.push({
      type: "statement",
      content: "  owner: signer::address_of(ctx),",
    });
  }

  for (const varDef of stateVariables) {
    const name = sanitizeIdentifier(varDef.name);
    if (varDef.type.startsWith("mapping(")) {
      const { keyType, valueType } = parseMappingType(varDef.type);
      const tableNew =
        moveTarget === TARGET_MAP.sui
          ? `table::new<${keyType}, ${valueType}>(ctx)`
          : `table::new<${keyType}, ${valueType}>()`;

      body.push({
        type: "statement",
        content: `  ${name}: ${tableNew},`,
      });
    } else {
      const defaultValue = getDefaultInitialValue(varDef.type);
      body.push({
        type: "statement",
        content: `  ${name}: ${defaultValue},`,
      });
    }
  }

  body.push({
    type: "statement",
    content: "});",
  });

  return {
    type: "function",
    visibility: "public entry",
    name: "init",
    params,
    returnType: undefined,
    body,
  };
}

export function generateFunctionNode(
  entry: ABIEntry,
  options: {
    contractName: string;
    customTypes?: Record<string, string>;
    moveTarget: MoveTarget;
  }
): FunctionNode {
  const { contractName, customTypes = {}, moveTarget } = options;

  const fnName = sanitizeIdentifier(entry.name || "unknown");
  const isView = isViewFunction(entry);
  const visibility = isView ? "public(friend)" : "public entry";

  let params: Param[] = [];

  if (!isView) {
    params.push({ name: "self", type: `&mut ${contractName}` });
  }

  const inputParams = (entry.inputs || []).map((param, index) => {
    const paramName = sanitizeIdentifier(param.name || `arg${index}`);
    const { moveType } = mapSolidityTypeToMove(
      param.type,
      param.components,
      paramName,
      customTypes
    );
    return { name: paramName, type: moveType };
  });

  params = [...params, ...inputParams];

  if (!isView) {
    params.push({ name: "ctx", type: "&mut TxContext" });
  }

  let returnType = "";
  if (entry.outputs && entry.outputs.length > 0) {
    const outputType = mapSolidityTypeToMove(entry.outputs[0].type).moveType;
    returnType = `: ${outputType}`;
  }

  const { body } = generateFunctionBody(entry);

  const bodyLines = body.split("\n").map((line) => ({
    type: "statement",
    content: line.trim(),
  }));

  return {
    type: "function",
    visibility,
    name: fnName,
    params,
    returnType,
    body: bodyLines as StatementNode[],
  };
}

export function printMoveModule(
  ast: ModuleNode,
  moveTarget: MoveTarget
): string {
  const lines = [];

  lines.push(`module ${ast.packageName}::${ast.name} {`);

  if (ast.uses.length > 0) {
    for (const use of ast.uses) {
      lines.push(`  ${use.path};`);
    }
    lines.push("");
  }

  for (const struct of ast.structs) {
    lines.push(printStruct(struct));
  }

  for (const fn of ast.functions) {
    lines.push(printFunction(fn));
  }

  lines.push("}");

  return lines.join("\n");
}

function printStruct(node: StructNode): string {
  const traits = [
    node.hasCopy ? "copy" : "",
    node.hasDrop ? "drop" : "",
    node.hasStore ? "store" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const traitStr = traits.length ? `has ${traits}` : "";

  const fieldLines = node.fields.map((f) => `  ${f.name}: ${f.type},`);

  return `struct ${node.name} ${traitStr} {\n${fieldLines.join("\n")}\n};\n`;
}

function printFunction(node: FunctionNode): string {
  const paramList = node.params.map((p) => `${p.name}: ${p.type}`).join(", ");

  const returnStr = node.returnType ? ` ${node.returnType}` : "";

  const bodyLines = node.body.map((stmt) => `  ${stmt.content}`).join("\n");

  return `${node.visibility} fun ${node.name}(${paramList})${returnStr} {\n${bodyLines}\n}\n`;
}

function isViewFunction(entry: ABIEntry): boolean {
  return entry.stateMutability === "view" || entry.stateMutability === "pure";
}

function generateFieldInit(
  name: string,
  type: string,
  moveTarget: MoveTarget
): string {
  if (type.startsWith("mapping(")) {
    const { keyType, valueType } = parseMappingType(type);
    return moveTarget === TARGET_MAP.sui
      ? `table::new<${keyType}, ${valueType}>(ctx)`
      : `table::new<${keyType}, ${valueType}>()`;
  }
  return getDefaultInitialValue(type);
}

function generateEventStructNode(entry: ABIEntry): StructNode {
  const structName = `${entry.name}Event`;
  const fields = (entry.inputs || []).map((param, i) => {
    const paramName = param.name ? sanitizeIdentifier(param.name) : `arg${i}`;
    const { moveType } = mapSolidityTypeToMove(param.type);
    return { name: paramName, type: moveType };
  });

  return {
    type: "struct",
    name: structName,
    hasCopy: true,
    hasDrop: true,
    hasStore: true,
    fields,
  };
}

function generateCustomErrorStructNode(
  name: string,
  fields: { name: string; type: string }[]
): StructNode {
  return {
    type: "struct",
    name: `${name}Error`,
    hasCopy: true,
    hasDrop: true,
    hasStore: true,
    fields,
  };
}

function buildMoveStateStructNode(
  contractName: string,
  stateVariables: { name: string; type: string }[],
  moveTarget: MoveTarget
): StructNode {
  const fields = [
    ...(moveTarget === TARGET_MAP.sui ? [{ name: "id", type: "UID" }] : []),
    { name: "owner", type: "address" },
    ...stateVariables.map((varDef) => {
      const name = sanitizeIdentifier(varDef.name);
      let moveType = mapSolidityTypeToMove(varDef.type).moveType;

      if (varDef.type.startsWith("mapping(")) {
        const { keyType, valueType } = parseMappingType(varDef.type);
        moveType = `Table::Table<${keyType}, ${valueType}>`;
      }

      return { name, type: moveType };
    }),
  ];

  return {
    type: "struct",
    name: contractName,
    hasCopy: true,
    hasDrop: true,
    hasStore: true,
    fields,
  };
}

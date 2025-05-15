import { mapSolidityTypeToMove } from "./typeMapper";
import { generateUseStatements } from "./importMapper";
import { ABIEntry, ParsedAbiResult, ParsedContract } from "../types";
import { sanitizeIdentifier } from "../utils/utils";

export function generateMoveModule(
  name: string,
  abi: ABIEntry[],
  inferredLibs: string[],
  stateVariables: { name: string; type: string }[],
  options: {
    verbose?: boolean;
    customTypes?: Record<string, string>;
  } = {}
): string {
  if (options.verbose) {
    console.log(`[VERBOSE] Starting module generation for ${name}`);
  }

  const { verbose = false, customTypes = {} } = options;

  const moduleName = sanitizeIdentifier(name);
  const useStatements = generateUseStatements(inferredLibs);
  const structDefs = new Map<string, string>();
  const functionDefs: string[] = [];

  for (const entry of abi) {
    if (entry.type === "function") {
      if (options.verbose) {
        console.log(`[VERBOSE] Processing function: ${entry.name}`);
      }
      functionDefs.push(generateFunction(entry, structDefs, customTypes));
    }
    if (entry.type === "event") {
      if (options.verbose) {
        console.log(`[VERBOSE] Processing event: ${entry.name}`);
      }
      generateEventStruct(entry, structDefs);
    }
  }

  const stateStruct = buildMoveStateStruct(name, stateVariables);

  if (options.verbose) {
    console.log(`[VERBOSE] Module generation complete`);
  }

  return `
      module ${moduleName} {
      ${useStatements.join("\n")}
      ${stateStruct}
      ${Array.from(structDefs.values()).join("\n\n")}
      ${functionDefs.join("\n\n")}
      }
      `.trim();
}

export function generateMove(parsed: ParsedAbiResult): string {
  return generateMoveModule(
    parsed.stateVariables[0]?.name || "MyContract",
    parsed.abi,
    [],
    parsed.stateVariables,
    {}
  );
}

export function generateMoveFromParsedContract(
  parsed: ParsedContract[]
): string {
  if (!parsed.length)
    throw new Error("No contracts found in parsed Solidity file");

  const contract = parsed[0];

  const abiEntries = contract.functions.map((fn) => ({
    type: "function" as const,
    name: fn.name,
    inputs: fn.params.map((p) => ({ name: p.name, type: p.type })),
    outputs: fn.returns.map((r) => ({ name: r.name, type: r.type })),
    stateMutability: fn.mutability,
  }));

  const stateVariables = contract.stateVariables;

  return generateMoveModule(
    contract.contractName,
    abiEntries,
    [],
    stateVariables
  );
}

function generateFunction(
  entry: ABIEntry,
  structDefs: Map<string, string>,
  customTypes?: Record<string, string>
): string {
  if (!entry.name) {
    throw new Error("Function entry must have a name");
  }

  const fnPrefix = isViewFunction(entry) ? "public(friend)" : "public fun";
  const params = (entry.inputs || []).map(
    (param: { name?: string; type: string; components?: any }, i: number) => {
      const paramName = param.name ? param.name : `arg${i}`;
      const name = sanitizeIdentifier(paramName);
      const { moveType, structs } = mapSolidityTypeToMove(
        param.type,
        param.components,
        name,
        customTypes || {}
      );

      structs?.forEach((struct) => {
        if (!structDefs.has(struct.name)) {
          structDefs.set(struct.name, formatStruct(struct.name, struct.fields));
        }
      });

      return `${name}: ${moveType}`;
    }
  );

  params.push("ctx: &mut TxContext");

  const body = generateFunctionBody(entry);

  return `  ${fnPrefix} ${sanitizeIdentifier(entry.name)}(${params.join(
    ", "
  )}) {
${body}
  }`;
}

function generateEventStruct(
  entry: ABIEntry,
  structDefs: Map<string, string>
): string {
  const structName = `${entry.name}Event`;
  const fields = (entry.inputs || []).map(
    (param: { name?: string; type: string; components?: any }, i: number) => {
      const paramName = param.name ? param.name : `arg${i}`;
      const name = sanitizeIdentifier(paramName);
      const { moveType } = mapSolidityTypeToMove(
        param.type,
        param.components,
        name
      );
      return `  ${name}: ${moveType},`;
    }
  );

  const structDef = `struct ${structName} has copy, drop, store {
${fields.join("\n")}
};`;

  if (!structDefs.has(structName)) {
    structDefs.set(structName, structDef);
  }

  return structDef;
}

function generateFunctionBody(entry: ABIEntry): string {
  const fnName = entry.name || "unknown";
  const lines: string[] = [];

  if (fnName.includes("require") || fnName.includes("revert")) {
    lines.push(`abort(0);  // TODO: improve error code`);
  } else if (fnName === "initialize" || fnName === "constructor") {
    lines.push(`self.owner = tx_context::sender(ctx);`);
  } else if (fnName.startsWith("onlyOwner")) {
    lines.push(`assert!(tx_context::sender(ctx) == self.owner, 0);`);
  } else if (fnName.includes("transfer")) {
    lines.push(`// TODO: implement token transfer logic`);
  } else if (fnName.includes("mint") || fnName.includes("burn")) {
    lines.push(`// TODO: implement mint/burn logic`);
  } else {
    lines.push(`// TODO: implement ${fnName} logic`);
  }

  if (entry.type === "event") {
    lines.push(`event::emit(${fnName}Event { /* fill fields */ });`);
  }

  return lines.map((line) => `    ${line}`).join("\n");
}

function buildMoveStateStruct(
  contractName: string,
  stateVariables: { name: string; type: string }[]
): string {
  const ownerField = { name: "owner", type: "address" };
  const idField = { name: "id", type: "UID" };

  const fields = [
    idField,
    ownerField,
    ...stateVariables.map((varDef) => ({
      name: sanitizeIdentifier(varDef.name),
      type: mapSolidityTypeToMove(varDef.type).moveType,
    })),
  ];

  return `struct ${contractName} has key {
  ${fields.map((f) => `${f.name}: ${f.type},`).join("\n  ")}
}`;
}

function isViewFunction(entry: ABIEntry): boolean {
  return entry.stateMutability === "view" || entry.stateMutability === "pure";
}

function formatStruct(
  name: string,
  fields: { name: string; type: string }[]
): string {
  const body = fields
    .map((f) => `  ${sanitizeIdentifier(f.name)}: ${f.type},`)
    .join("\n");

  return `struct ${name} has copy, drop, store {
${body}
};`;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMoveModule = generateMoveModule;
exports.generateMove = generateMove;
exports.generateMoveFromParsedContract = generateMoveFromParsedContract;
const typeMapper_1 = require("./typeMapper");
const importMapper_1 = require("./importMapper");
const utils_1 = require("../utils/utils");
function generateMoveModule(name, abi, inferredLibs, stateVariables, options = {}) {
    if (options.verbose) {
        console.log(`[VERBOSE] Starting module generation for ${name}`);
    }
    const { verbose = false, customTypes = {} } = options;
    const moduleName = (0, utils_1.sanitizeIdentifier)(name);
    const useStatements = (0, importMapper_1.generateUseStatements)(inferredLibs);
    const structDefs = new Map();
    const functionDefs = [];
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
function generateMove(parsed) {
    var _a;
    return generateMoveModule(((_a = parsed.stateVariables[0]) === null || _a === void 0 ? void 0 : _a.name) || "MyContract", parsed.abi, [], parsed.stateVariables, {});
}
function generateMoveFromParsedContract(parsed) {
    if (!parsed.length)
        throw new Error("No contracts found in parsed Solidity file");
    const contract = parsed[0];
    const abiEntries = contract.functions.map((fn) => ({
        type: "function",
        name: fn.name,
        inputs: fn.params.map((p) => ({ name: p.name, type: p.type })),
        outputs: fn.returns.map((r) => ({ name: r.name, type: r.type })),
        stateMutability: fn.mutability,
    }));
    const stateVariables = contract.stateVariables;
    return generateMoveModule(contract.contractName, abiEntries, [], stateVariables);
}
function generateFunction(entry, structDefs, customTypes) {
    if (!entry.name) {
        throw new Error("Function entry must have a name");
    }
    const fnPrefix = isViewFunction(entry) ? "public(friend)" : "public fun";
    const params = (entry.inputs || []).map((param, i) => {
        const paramName = param.name ? param.name : `arg${i}`;
        const name = (0, utils_1.sanitizeIdentifier)(paramName);
        const { moveType, structs } = (0, typeMapper_1.mapSolidityTypeToMove)(param.type, param.components, name, customTypes || {});
        structs === null || structs === void 0 ? void 0 : structs.forEach((struct) => {
            if (!structDefs.has(struct.name)) {
                structDefs.set(struct.name, formatStruct(struct.name, struct.fields));
            }
        });
        return `${name}: ${moveType}`;
    });
    params.push("ctx: &mut TxContext");
    const body = generateFunctionBody(entry);
    return `  ${fnPrefix} ${(0, utils_1.sanitizeIdentifier)(entry.name)}(${params.join(", ")}) {
${body}
  }`;
}
function generateEventStruct(entry, structDefs) {
    const structName = `${entry.name}Event`;
    const fields = (entry.inputs || []).map((param, i) => {
        const paramName = param.name ? param.name : `arg${i}`;
        const name = (0, utils_1.sanitizeIdentifier)(paramName);
        const { moveType } = (0, typeMapper_1.mapSolidityTypeToMove)(param.type, param.components, name);
        return `  ${name}: ${moveType},`;
    });
    const structDef = `struct ${structName} has copy, drop, store {
${fields.join("\n")}
};`;
    if (!structDefs.has(structName)) {
        structDefs.set(structName, structDef);
    }
    return structDef;
}
function generateFunctionBody(entry) {
    const fnName = entry.name || "unknown";
    const lines = [];
    if (fnName.includes("require") || fnName.includes("revert")) {
        lines.push(`abort(0);  // TODO: improve error code`);
    }
    else if (fnName === "initialize" || fnName === "constructor") {
        lines.push(`self.owner = tx_context::sender(ctx);`);
    }
    else if (fnName.startsWith("onlyOwner")) {
        lines.push(`assert!(tx_context::sender(ctx) == self.owner, 0);`);
    }
    else if (fnName.includes("transfer")) {
        lines.push(`// TODO: implement token transfer logic`);
    }
    else if (fnName.includes("mint") || fnName.includes("burn")) {
        lines.push(`// TODO: implement mint/burn logic`);
    }
    else {
        lines.push(`// TODO: implement ${fnName} logic`);
    }
    if (entry.type === "event") {
        lines.push(`event::emit(${fnName}Event { /* fill fields */ });`);
    }
    return lines.map((line) => `    ${line}`).join("\n");
}
function buildMoveStateStruct(contractName, stateVariables) {
    const ownerField = { name: "owner", type: "address" };
    const idField = { name: "id", type: "UID" };
    const fields = [
        idField,
        ownerField,
        ...stateVariables.map((varDef) => ({
            name: (0, utils_1.sanitizeIdentifier)(varDef.name),
            type: (0, typeMapper_1.mapSolidityTypeToMove)(varDef.type).moveType,
        })),
    ];
    return `struct ${contractName} has key {
  ${fields.map((f) => `${f.name}: ${f.type},`).join("\n  ")}
}`;
}
function isViewFunction(entry) {
    return entry.stateMutability === "view" || entry.stateMutability === "pure";
}
function formatStruct(name, fields) {
    const body = fields
        .map((f) => `  ${(0, utils_1.sanitizeIdentifier)(f.name)}: ${f.type},`)
        .join("\n");
    return `struct ${name} has copy, drop, store {
${body}
};`;
}

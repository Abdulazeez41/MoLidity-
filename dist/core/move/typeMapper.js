"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSolidityTypeToMove = mapSolidityTypeToMove;
exports.getMoveTypeString = getMoveTypeString;
exports.renderMoveStruct = renderMoveStruct;
const utils_1 = require("../utils/utils");
// Built-in Solidity → Move type mapping
const solidityToMoveTypeMap = {
    uint256: "u256",
    uint128: "u128",
    uint64: "u64",
    uint8: "u8",
    int256: "i256",
    address: "address",
    bool: "bool",
    string: "vector<u8>",
    bytes: "vector<u8>",
};
function isArrayType(type) {
    return type.endsWith("[]");
}
function stripArrayBrackets(type) {
    return type.replace(/\[\]$/, "");
}
function isMappingType(type) {
    return type.startsWith("mapping(");
}
function parseMappingTypes(type) {
    const match = type.match(/^mapping\(([^,]+),\s*([^)]+)\)$/);
    if (!match)
        throw new Error(`Invalid mapping type: ${type}`);
    return [match[1].trim(), match[2].trim()];
}
/**
 * Maps Solidity types to Move types with support for tuples, arrays, and mappings.
 */
function mapSolidityTypeToMove(type, components, contextName = "Tuple", customTypes = {}) {
    // Use custom type override if available
    if (customTypes[type]) {
        return { moveType: customTypes[type], structs: [] };
    }
    // Handle tuple
    if (type === "tuple" && components) {
        const structName = `${contextName}Struct`;
        const fields = components.map((comp, index) => {
            const rawName = comp.name || `field${index}`;
            const fieldName = (0, utils_1.sanitizeIdentifier)(rawName);
            const { moveType } = mapSolidityTypeToMove(comp.type, comp.components, `${contextName}_${fieldName}`, customTypes);
            return { name: fieldName, type: moveType };
        });
        const struct = { name: structName, fields };
        const nestedStructs = components.flatMap((comp, index) => {
            const result = mapSolidityTypeToMove(comp.type, comp.components, `${contextName}_${(0, utils_1.sanitizeIdentifier)(comp.name || `field${index}`)}`, customTypes);
            return result.structs;
        });
        return {
            moveType: structName,
            structs: [struct, ...nestedStructs],
        };
    }
    // Handle array
    if (isArrayType(type)) {
        const innerType = stripArrayBrackets(type);
        const result = mapSolidityTypeToMove(innerType, undefined, contextName, customTypes);
        return {
            moveType: `vector<${result.moveType}>`,
            structs: result.structs,
        };
    }
    // Handle mapping
    if (isMappingType(type)) {
        const [keyType, valueType] = parseMappingTypes(type);
        const keyResult = mapSolidityTypeToMove(keyType, undefined, `${contextName}_Key`, customTypes);
        const valueResult = mapSolidityTypeToMove(valueType, undefined, `${contextName}_Value`, customTypes);
        return {
            moveType: `Table::Table<${keyResult.moveType}, ${valueResult.moveType}>`,
            structs: [...keyResult.structs, ...valueResult.structs],
        };
    }
    // Primitive types
    const mapped = solidityToMoveTypeMap[type];
    if (!mapped) {
        throw new Error(`Unsupported Solidity type: ${type}. Consider adding it to customTypes.`);
    }
    return {
        moveType: mapped,
        structs: [],
    };
}
/**
 * Public utility to get Move type string directly
 */
function getMoveTypeString(type, components, customTypes = {}) {
    return mapSolidityTypeToMove(type, components, "Tuple", customTypes).moveType;
}
/**
 * Converts a MoveStruct to Move language syntax.
 */
function renderMoveStruct(struct) {
    const lines = struct.fields.map((f) => `  ${f.name}: ${f.type},`);
    return `struct ${struct.name} has copy, drop, store {
${lines.join("\n")}
};`;
}

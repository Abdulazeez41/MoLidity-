import { sanitizeIdentifier } from "../utils/utils";
import { logger } from "../utils/logger";

export interface MoveStruct {
  name: string;
  fields: { name: string; type: string }[];
}

// Built-in Solidity → Move type mapping
const solidityToMoveTypeMap: Record<string, string> = {
  // Unsigned ints
  uint8: "u8",
  uint16: "u16",
  uint32: "u32",
  uint64: "u64",
  uint128: "u128",
  uint256: "u256",

  // Signed ints
  int8: "i8",
  int16: "i16",
  int32: "i32",
  int64: "i64",
  int128: "i128",
  int256: "i256",

  // Other primitives
  address: "address",
  bool: "bool",

  // Strings and bytes
  string: "String",
  bytes: "vector<u8>",
  bytes1: "vector<u8>",
  bytes2: "vector<u8>",
  bytes4: "vector<u8>",
  bytes8: "vector<u8>",
  bytes16: "vector<u8>",
  bytes32: "vector<u8>",
};

function isArrayType(type: string): { depth: number; baseType: string } {
  let count = 0;
  let t = type.trim();
  while (t.endsWith("[]")) {
    count++;
    t = t.slice(0, -2).trim();
  }
  return { depth: count, baseType: t };
}

function isMappingType(type: string): boolean {
  return type.startsWith("mapping(");
}

function parseMappingTypes(type: string): [string, string] {
  const match = type.match(/^mapping\(([^,]+),\s*([^)]+)\)$/);
  if (!match) throw new Error(`Invalid mapping type: ${type}`);
  return [match[1].trim(), match[2].trim()];
}

function isSolidityEnum(type: string): boolean {
  return type.startsWith("enum ");
}

/**
 * Maps Solidity types to Move types with support for tuples, arrays, mappings, and enums.
 */
export function mapSolidityTypeToMove(
  type: string,
  components?: { name: string; type: string; components?: any[] }[],
  contextName = "Tuple",
  customTypes: Record<string, string> = {}
): { moveType: string; structs: MoveStruct[] } {
  if (customTypes[type]) {
    return { moveType: customTypes[type], structs: [] };
  }

  // Handle enum emulation
  if (isSolidityEnum(type)) {
    const enumName = type.replace(/^enum\s+/, "").trim();
    const enumStruct: MoveStruct = {
      name: `${enumName}Kind`,
      fields: [{ name: "kind", type: "u8" }],
    };

    return {
      moveType: enumStruct.name,
      structs: [enumStruct],
    };
  }

  // Handle tuple
  if (type === "tuple" && components) {
    const structName = `${contextName}Struct`;
    const fields = components.map((comp, index) => {
      const rawName = comp.name || `field${index}`;
      const fieldName = sanitizeIdentifier(rawName);
      const nestedResult = mapSolidityTypeToMove(
        comp.type,
        comp.components,
        `${contextName}_${fieldName}`,
        customTypes
      );

      return {
        name: fieldName,
        type: nestedResult.moveType,
      };
    });

    const struct: MoveStruct = { name: structName, fields };

    const nestedStructs = components.flatMap(
      (comp, index) =>
        mapSolidityTypeToMove(
          comp.type,
          comp.components,
          `${contextName}_${sanitizeIdentifier(comp.name || `field${index}`)}`,
          customTypes
        ).structs
    );

    return {
      moveType: structName,
      structs: [struct, ...nestedStructs],
    };
  }

  // Handle array with deep nesting
  const arrayInfo = isArrayType(type);
  if (arrayInfo.depth > 0) {
    const baseType = arrayInfo.baseType;

    let innerResult = mapSolidityTypeToMove(
      baseType,
      undefined,
      contextName,
      customTypes
    );
    let finalType = innerResult.moveType;

    for (let i = 0; i < arrayInfo.depth; i++) {
      finalType = `vector<${finalType}>`;
    }

    return {
      moveType: finalType,
      structs: innerResult.structs,
    };
  }

  // Handle mapping
  if (isMappingType(type)) {
    const [keyType, valueType] = parseMappingTypes(type);

    const keyResult = mapSolidityTypeToMove(
      keyType,
      undefined,
      `${contextName}_Key`,
      customTypes
    );
    const valueResult = mapSolidityTypeToMove(
      valueType,
      undefined,
      `${contextName}_Value`,
      customTypes
    );

    return {
      moveType: `Table::Table<${keyResult.moveType}, ${valueResult.moveType}>`,
      structs: [...keyResult.structs, ...valueResult.structs],
    };
  }

  // Primitive types
  const mapped = solidityToMoveTypeMap[type];
  if (!mapped) {
    logger.warn(
      `Unsupported Solidity type: ${type}. Consider adding it to customTypes.`
    );
    return {
      moveType: `// UNSUPPORTED: ${type}, use u8 as placeholder`,
      structs: [],
    };
  }

  return {
    moveType: mapped,
    structs: [],
  };
}

export function getDefaultInitialValue(type: string): string {
  const result = mapSolidityTypeToMove(type);
  const moveType = result.moveType;

  switch (moveType) {
    case "u8":
    case "u64":
    case "u128":
    case "u256":
    case "i8":
    case "i64":
    case "i128":
    case "i256":
      return "0";

    case "bool":
      return "false";

    case "address":
      return "::default()";

    case "String":
      return 'utf8(b"")';

    case "vector<u8>":
      return "vector[]";

    case "Table::Table<_, _>":
      return "table::new(ctx)";

    default:
      if (moveType.startsWith("// UNSUPPORTED")) {
        return "// TODO: Initialize manually";
      }
      return `// TODO: initialize ${moveType}`;
  }
}

/**
 * Public utility to get Move type string directly
 */
export function getMoveTypeString(
  type: string,
  components?: { name: string; type: string; components?: any[] }[],
  customTypes: Record<string, string> = {}
): string {
  return mapSolidityTypeToMove(type, components, "Tuple", customTypes).moveType;
}

/**
 * Converts a MoveStruct to Move language syntax.
 */
export function renderMoveStruct(struct: MoveStruct): string {
  const lines = struct.fields.map((f) => `    ${f.name}: ${f.type},`);
  return `
struct ${struct.name} has copy, drop, store {
${lines.join("\n")}
}
`.trim();
}

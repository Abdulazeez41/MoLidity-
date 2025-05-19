import { mapSolidityTypeToMove } from "../typeMapper";
import { sanitizeIdentifier } from "../../utils/utils";
import { MappingInfo } from "../../types";

export function parseMappingType(type: string): MappingInfo {
  const match = type.match(/^mapping\(([^,]+)\s*=>\s*([^)]+)\)$/);
  if (!match) throw new Error(`Invalid mapping type: ${type}`);
  const [keyTypeRaw, valueTypeRaw] = match.slice(1).map((t) => t.trim());

  const keyType = mapSolidityTypeToMove(keyTypeRaw).moveType;
  const valueType = mapSolidityTypeToMove(valueTypeRaw).moveType;

  return {
    name: `table_${sanitizeIdentifier(keyType)}_${sanitizeIdentifier(
      valueType
    )}`,
    keyType,
    valueType,
  };
}

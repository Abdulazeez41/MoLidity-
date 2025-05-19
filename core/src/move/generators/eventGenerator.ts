import { ABIEntry } from "../../types";
import { sanitizeIdentifier } from "../../utils/utils";
import { mapSolidityTypeToMove } from "../typeMapper";

export function generateEventStruct(
  entry: ABIEntry,
  structDefs: Map<string, string>
): string {
  const structName = `${entry.name}Event`;

  let comment = "";
  if (entry.src) {
    comment = `// [SOLIDITY] Source: ${entry.src}`;
  }

  if (structDefs.has(structName)) return structDefs.get(structName)!;

  const fields = (entry.inputs || []).map((param: any, i: number) => {
    const paramName = param.name ? param.name : `arg${i}`;
    const name = sanitizeIdentifier(paramName);

    const isIndexed = param.indexed === true;

    const { moveType } = mapSolidityTypeToMove(
      param.type,
      param.components,
      name
    );

    return {
      name,
      type: moveType,
      isIndexed,
    };
  });

  const fieldLines = fields.map((f) => `  ${f.name}: ${f.type},`).join("\n");

  const structDef = `${comment}
                    struct ${structName} has copy, drop, store {
                        ${fieldLines}
                    };
`;

  structDefs.set(structName, structDef);
  return structDef;
}

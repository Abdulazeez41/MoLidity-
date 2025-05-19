import { sanitizeIdentifier } from "../../utils/utils";

export function generateCustomErrorStruct(
  name: string,
  fields: { name: string; type: string }[]
): string {
  const structName = `${sanitizeIdentifier(name)}Error`;
  const fieldLines = fields
    .map((f) => `  ${sanitizeIdentifier(f.name)}: ${f.type},`)
    .join("\n");

  return `
        struct ${structName} has copy, drop, store {
            ${fieldLines}
        };
`;
}

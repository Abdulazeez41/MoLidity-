import { ABIEntry } from "../types";

export function generateDocs(abi: ABIEntry[]): string {
  return abi
    .map((entry) => {
      const inputs =
        entry.inputs?.map((i) => `${i.name}: ${i.type}`).join(", ") || "";
      return `### ${entry.name}\n- Type: ${entry.type}\n- Inputs: ${inputs}\n`;
    })
    .join("\n");
}

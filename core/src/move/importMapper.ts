import { ABIEntryForImport } from "../types";
import { MoveTarget, TARGET_MAP } from "./targetMapper";

export const solidityToMoveLibraryMap: Record<string, string> = {
  SafeMath: "0x1::SafeMath",
  Ownable: "0x1::AccessControl",
  IERC20: "0x1::coin",
  Address: "0x1::AddressUtils",
};

export function inferLibrariesFromABI(abi: ABIEntryForImport[]): string[] {
  const libs = new Set<string>();

  for (const entry of abi) {
    if (entry.name === "transfer" || entry.name === "approve") {
      libs.add("IERC20");
      libs.add("SafeMath");
    }
    if (entry.name === "owner") {
      libs.add("Ownable");
    }
    if (Array.isArray(entry.inputs)) {
      for (const input of entry.inputs) {
        if (input.type === "address") {
          libs.add("Address");
          break;
        }
      }
    }
  }

  return Array.from(libs);
}

export function generateUseStatements(
  libs: string[],
  moveTarget: MoveTarget = TARGET_MAP.sui
): string[] {
  const useStatements = libs.map((lib) => {
    const moveImport = solidityToMoveLibraryMap[lib];
    return moveImport
      ? `use ${moveImport};`
      : `// TODO: Missing mapping for ${lib}`;
  });

  if (libs.includes("table") && moveTarget.tableImport) {
    if (!useStatements.includes(moveTarget.tableImport)) {
      useStatements.unshift(moveTarget.tableImport);
    }
  }

  if (libs.includes("event") && moveTarget.eventImport) {
    if (!useStatements.includes(moveTarget.eventImport)) {
      useStatements.unshift(moveTarget.eventImport);
    }
  }

  if (libs.includes("error") && moveTarget.abortImport) {
    if (!useStatements.includes(moveTarget.abortImport)) {
      useStatements.unshift(moveTarget.abortImport);
    }
  }

  return useStatements;
}

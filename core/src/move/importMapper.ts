import { ABIEntryForImport } from "../types";

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

export function generateUseStatements(libs: string[]): string[] {
  return libs.map((lib) => {
    const moveImport = solidityToMoveLibraryMap[lib];
    return moveImport
      ? `use ${moveImport};`
      : `// TODO: Missing mapping for ${lib}`;
  });
}

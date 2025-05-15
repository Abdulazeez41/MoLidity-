import { describe, it, expect } from "vitest";
import { mapSolidityTypeToMove } from "../src/move/typeMapper";

describe("mapSolidityTypeToMove", () => {
  it("maps basic types", () => {
    expect(mapSolidityTypeToMove("uint256")).toBe("u256");
    expect(mapSolidityTypeToMove("address")).toBe("address");
    expect(mapSolidityTypeToMove("bool")).toBe("bool");
  });

  it("maps arrays and mappings", () => {
    expect(mapSolidityTypeToMove("uint256[]")).toBe("vector<u256>");
    expect(mapSolidityTypeToMove("mapping(address => uint256)")).toBe(
      "Table<address, u256>"
    );
  });
});

import { describe, it, expect } from "vitest";
import { generateMoveModule } from "../src/move/moveGenerator";

describe("generateMoveModule", () => {
  it("should generate Move module from simple ABI", () => {
    const abi = [
      {
        name: "transfer",
        type: "function",
        inputs: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
        ],
        outputs: [],
      },
    ];

    const inferredLibs = ["0x1::string", "0x1::vector"];
    const stateVariables = [
      { name: "balances", type: "mapping(address => uint256)" },
    ];

    const result = generateMoveModule(
      "MyToken",
      abi,
      inferredLibs,
      stateVariables,
      { verbose: true }
    );

    expect(result).toContain("public fun transfer");
    expect(result).toContain("MyToken");
  });
});

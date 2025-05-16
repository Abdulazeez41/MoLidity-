import { describe, it, expect } from "vitest";
import { parseFullABI } from "../src/abi/abiParser";

describe("parseFullABI", () => {
  it("parses a simple ABI", () => {
    const abiJson = JSON.stringify([
      {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
    ]);

    const parsed = parseFullABI(abiJson) as unknown as Array<{
      name: string;
      inputs: Array<{ name: string; type: string }>;
    }>;

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed[0].name).toBe("balanceOf");
    expect(parsed[0].inputs.length).toBe(1);
  });
});

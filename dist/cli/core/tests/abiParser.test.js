"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const abiParser_1 = require("../src/abi/abiParser");
(0, vitest_1.describe)("parseFullABI", () => {
    (0, vitest_1.it)("parses a simple ABI", () => {
        const abiJson = JSON.stringify([
            {
                type: "function",
                name: "balanceOf",
                inputs: [{ name: "account", type: "address" }],
                outputs: [{ name: "", type: "uint256" }],
                stateMutability: "view",
            },
        ]);
        const parsed = (0, abiParser_1.parseFullABI)(abiJson);
        (0, vitest_1.expect)(parsed).toBeInstanceOf(Array);
        (0, vitest_1.expect)(parsed[0].name).toBe("balanceOf");
        (0, vitest_1.expect)(parsed[0].inputs.length).toBe(1);
    });
});

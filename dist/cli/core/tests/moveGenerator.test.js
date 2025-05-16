"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const moveGenerator_1 = require("../src/move/moveGenerator");
(0, vitest_1.describe)("generateMoveModule", () => {
    (0, vitest_1.it)("should generate Move module from simple ABI", () => {
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
        const result = (0, moveGenerator_1.generateMoveModule)("MyToken", abi, inferredLibs, stateVariables, { verbose: true });
        (0, vitest_1.expect)(result).toContain("public fun transfer");
        (0, vitest_1.expect)(result).toContain("MyToken");
    });
});

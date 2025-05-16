"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const typeMapper_1 = require("../src/move/typeMapper");
(0, vitest_1.describe)("mapSolidityTypeToMove", () => {
    (0, vitest_1.it)("maps basic types", () => {
        (0, vitest_1.expect)((0, typeMapper_1.mapSolidityTypeToMove)("uint256")).toBe("u256");
        (0, vitest_1.expect)((0, typeMapper_1.mapSolidityTypeToMove)("address")).toBe("address");
        (0, vitest_1.expect)((0, typeMapper_1.mapSolidityTypeToMove)("bool")).toBe("bool");
    });
    (0, vitest_1.it)("maps arrays and mappings", () => {
        (0, vitest_1.expect)((0, typeMapper_1.mapSolidityTypeToMove)("uint256[]")).toBe("vector<u256>");
        (0, vitest_1.expect)((0, typeMapper_1.mapSolidityTypeToMove)("mapping(address => uint256)")).toBe("Table<address, u256>");
    });
});

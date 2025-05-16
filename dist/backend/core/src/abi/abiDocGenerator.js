"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocs = generateDocs;
function generateDocs(abi) {
    return abi
        .map((entry) => {
        var _a;
        const inputs = ((_a = entry.inputs) === null || _a === void 0 ? void 0 : _a.map((i) => `${i.name}: ${i.type}`).join(", ")) || "";
        return `### ${entry.name}\n- Type: ${entry.type}\n- Inputs: ${inputs}\n`;
    })
        .join("\n");
}

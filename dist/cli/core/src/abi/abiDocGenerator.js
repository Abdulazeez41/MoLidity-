"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocs = generateDocs;
function generateDocs(abi) {
    return abi
        .map((entry) => {
        const inputs = entry.inputs?.map((i) => `${i.name}: ${i.type}`).join(", ") || "";
        return `### ${entry.name}\n- Type: ${entry.type}\n- Inputs: ${inputs}\n`;
    })
        .join("\n");
}

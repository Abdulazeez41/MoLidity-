"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solidityToMoveLibraryMap = void 0;
exports.inferLibrariesFromABI = inferLibrariesFromABI;
exports.generateUseStatements = generateUseStatements;
exports.solidityToMoveLibraryMap = {
    SafeMath: "0x1::SafeMath",
    Ownable: "0x1::AccessControl",
    IERC20: "0x1::coin",
    Address: "0x1::AddressUtils",
};
function inferLibrariesFromABI(abi) {
    const libs = new Set();
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
function generateUseStatements(libs) {
    return libs.map((lib) => {
        const moveImport = exports.solidityToMoveLibraryMap[lib];
        return moveImport
            ? `use ${moveImport};`
            : `// TODO: Missing mapping for ${lib}`;
    });
}

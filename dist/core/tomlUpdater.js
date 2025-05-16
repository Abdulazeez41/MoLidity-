"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMoveTomlDeps = ensureMoveTomlDeps;
const fs_1 = __importDefault(require("fs"));
const KNOWN_DEPENDENCIES = {
    MoveStdlib: `
[dependencies.MoveStdlib]
git = "https://github.com/move-language/move "
subdir = "language/move-stdlib"
rev = "main"`.trim(),
    Sui: `
[dependencies.Sui]
git = "https://github.com/MystenLabs/sui.git "
subdir = "crates/sui-framework"
rev = "devnet"`.trim(),
};
function ensureMoveTomlDeps(tomlPath, usedLibs, options = {}) {
    const { verbose = false } = options;
    if (!fs_1.default.existsSync(tomlPath)) {
        throw new Error(`Move.toml not found at ${tomlPath}`);
    }
    let toml = fs_1.default.readFileSync(tomlPath, "utf-8");
    const newlyAddedDeps = [];
    for (const lib of usedLibs) {
        const depSpec = KNOWN_DEPENDENCIES[lib];
        if (!depSpec) {
            console.warn(`⚠️ Unknown library requested: ${lib}. Consider adding it manually.`);
            continue;
        }
        const sectionHeader = `[dependencies.${lib}]`;
        if (!toml.includes(sectionHeader)) {
            toml += `\n\n${depSpec}`;
            newlyAddedDeps.push(lib);
            if (verbose) {
                console.log(`[VERBOSE] Adding dependency: ${lib}`);
            }
        }
        else {
            if (verbose) {
                console.log(`[VERBOSE] Skipping existing dependency: ${lib}`);
            }
        }
    }
    if (newlyAddedDeps.length > 0) {
        fs_1.default.writeFileSync(tomlPath, toml, "utf-8");
        console.log(`✅ Added dependencies to Move.toml: ${newlyAddedDeps.join(", ")}`);
    }
    else {
        if (verbose) {
            console.log(`[VERBOSE] No new dependencies needed`);
        }
    }
}

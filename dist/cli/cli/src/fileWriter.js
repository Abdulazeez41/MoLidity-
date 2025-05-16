"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMoveModuleToFile = writeMoveModuleToFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function writeMoveModuleToFile(contractName, moveCode, outputDir, options = {}) {
    const { dryRun = false, force = false, verbose = false } = options;
    const outputPath = path_1.default.join(outputDir, `${contractName}.move`);
    if (dryRun) {
        console.log("=== DRY RUN - OUTPUT ===");
        console.log(moveCode);
        return outputPath;
    }
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created output directory: ${outputDir}`);
    }
    if (fs_1.default.existsSync(outputPath) && !force) {
        throw new Error(`File already exists at ${outputPath}. Use --force to overwrite.`);
    }
    fs_1.default.writeFileSync(outputPath, moveCode, "utf-8");
    if (verbose) {
        console.log(`✅ Wrote Move module to ${outputPath}`);
    }
    return outputPath;
}

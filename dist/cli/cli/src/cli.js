"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTranspilerConfig = loadTranspilerConfig;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const { join } = path;
const fs = __importStar(require("fs"));
const { readFileSync } = fs;
const index_1 = require("./index");
const program = new commander_1.Command();
function loadTranspilerConfig(configPath) {
    const fullPath = configPath
        ? join(process.cwd(), configPath)
        : join(process.cwd(), "transpiler.config.json");
    try {
        const data = readFileSync(fullPath, "utf8");
        return JSON.parse(data);
    }
    catch (err) {
        console.warn(`⚠️ Config not found at ${fullPath}. Using defaults.`);
        return {};
    }
}
const config = loadTranspilerConfig();
program
    .name("solidity-to-move")
    .description("CLI tool to transpile Solidity ABI JSON into Move smart contract modules")
    .version("1.0.0");
program
    .command("transpile")
    .description("Transpile a Solidity ABI file to Move source")
    .requiredOption("-i, --input <path>", "Path to the ABI JSON file")
    .requiredOption("-n, --name <contractName>", "Name for the generated Move module")
    .option("-o, --output <dir>", "Output directory for the Move module", "output")
    .option("-l, --libs <libs...>", "List of inferred Move dependencies (e.g. MoveStdlib)")
    .option("-v, --verbose", "Enable verbose logging")
    .option("--dry-run", "Print the output Move code without saving")
    .option("--force", "Overwrite existing files if they exist")
    .action(async (options) => {
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.output);
    const contractName = options.name;
    const inferredLibs = options.libs || [];
    const verbose = options.verbose || false;
    const dryRun = options.dryRun || false;
    const force = options.force || false;
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Input ABI file not found: ${inputPath}`);
        process.exit(1);
    }
    try {
        const outputPath = await (0, index_1.transpileAbiToMove)(inputPath, contractName, outputDir, inferredLibs, { dryRun, force, verbose, config });
        if (!dryRun) {
            console.log(chalk_1.default.green(`✅ Successfully generated Move module at: ${outputPath}`));
        }
    }
    catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse(process.argv);

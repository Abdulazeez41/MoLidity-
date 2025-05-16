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
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileAbiToMove = transpileAbiToMove;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const abiParser_1 = require("../../core/src/abi/abiParser");
const moveGenerator_1 = require("../../core/src/move/moveGenerator");
const fileWriter_1 = require("./fileWriter");
const tomlUpdater_1 = require("../../core/src/tomlUpdater");
async function transpileAbiToMove(inputPath, contractName, outputDir, inferredLibs, options = {}) {
    const { config, plugins, verbose = false } = options;
    const { abi, stateVariables } = (0, abiParser_1.parseFullABI)(inputPath);
    if (options.verbose) {
        console.log(`[VERBOSE] Parsed ${abi.length} ABI entries`);
        console.log(`[VERBOSE] Found ${stateVariables.length} state variables`);
    }
    if (plugins) {
        plugins.runBeforeParseABI(abi);
    }
    if (plugins) {
        plugins.runAfterParseABI(abi);
    }
    const customTypes = {
        ...config?.typeMappings,
        ...plugins?.getAllTypeOverrides(),
    };
    const customLibs = {
        ...config?.libraryMappings,
        ...plugins?.getAllLibraryOverrides(),
    };
    const functionEntries = (0, abiParser_1.getFunctionABIs)(abi);
    if (options.verbose) {
        console.log(`[VERBOSE] Generating Move module for ${functionEntries.length} functions`);
    }
    let moveCode = (0, moveGenerator_1.generateMoveModule)(contractName, abi, [...inferredLibs, ...Object.keys(customLibs)], stateVariables, { verbose, customTypes });
    if (plugins) {
        plugins.runBeforeGenerateMove(contractName, abi);
    }
    if (plugins) {
        moveCode = plugins.runAfterGenerateMove(moveCode);
    }
    if (options.verbose) {
        console.log(`[VERBOSE] Generated Move module code`);
    }
    const moveTomlPath = path.join(outputDir, "Move.toml");
    if (fs.existsSync(moveTomlPath)) {
        if (options.verbose) {
            console.log(`[VERBOSE] Updating Move.toml with dependencies`);
        }
        (0, tomlUpdater_1.ensureMoveTomlDeps)(moveTomlPath, inferredLibs);
    }
    return (0, fileWriter_1.writeMoveModuleToFile)(contractName, moveCode, outputDir, options);
}

import * as path from "path";
import * as fs from "fs";

import { PluginManager } from "../../core/src/plugin/pluginManager";

import { TranspilerConfig } from "../../core/src/config/config";

import { parseFullABI, getFunctionABIs } from "../../core/src/abi/abiParser";

import { generateMoveModule } from "../../core/src/move/moveGenerator";

import { writeMoveModuleToFile } from "./fileWriter";

import { ensureMoveTomlDeps } from "../../core/src/tomlUpdater";

export interface TranspileOptions {
  dryRun?: boolean;
  force?: boolean;
  verbose?: boolean;
  config?: TranspilerConfig;
  plugins?: PluginManager;
}

export async function transpileAbiToMove(
  inputPath: string,
  contractName: string,
  outputDir: string,
  inferredLibs: string[],
  options: TranspileOptions = {}
): Promise<string> {
  const { config, plugins, verbose = false } = options;

  const { abi, stateVariables } = parseFullABI(inputPath);

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

  const functionEntries = getFunctionABIs(abi);
  if (options.verbose) {
    console.log(
      `[VERBOSE] Generating Move module for ${functionEntries.length} functions`
    );
  }

  let moveCode = generateMoveModule(
    contractName,
    abi,
    [...inferredLibs, ...Object.keys(customLibs)],
    stateVariables,
    { verbose, customTypes }
  );

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
    ensureMoveTomlDeps(moveTomlPath, inferredLibs);
  }

  return writeMoveModuleToFile(contractName, moveCode, outputDir, options);
}

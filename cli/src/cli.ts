import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
const { join } = path;

import * as fs from "fs";
const { readFileSync } = fs;

import { transpileAbiToMove } from "./index";
import { TranspilerConfig } from "@core/config/config";

const program = new Command();

export function loadTranspilerConfig(configPath?: string): TranspilerConfig {
  const fullPath = configPath
    ? join(process.cwd(), configPath)
    : join(process.cwd(), "transpiler.config.json");
  try {
    const data = readFileSync(fullPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.warn(`⚠️ Config not found at ${fullPath}. Using defaults.`);
    return {};
  }
}

const config = loadTranspilerConfig();

program
  .name("solidity-to-move")
  .description(
    "CLI tool to transpile Solidity ABI JSON into Move smart contract modules"
  )
  .version("1.0.0");

program
  .command("transpile")
  .description("Transpile a Solidity ABI file to Move source")
  .requiredOption("-i, --input <path>", "Path to the ABI JSON file")
  .requiredOption(
    "-n, --name <contractName>",
    "Name for the generated Move module"
  )
  .option(
    "-o, --output <dir>",
    "Output directory for the Move module",
    "output"
  )
  .option(
    "-l, --libs <libs...>",
    "List of inferred Move dependencies (e.g. MoveStdlib)"
  )
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
      const outputPath = await transpileAbiToMove(
        inputPath,
        contractName,
        outputDir,
        inferredLibs,
        { dryRun, force, verbose, config }
      );

      if (!dryRun) {
        console.log(
          chalk.green(`✅ Successfully generated Move module at: ${outputPath}`)
        );
      }
    } catch (err) {
      console.error(`❌ Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

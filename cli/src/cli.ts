import { Command } from "commander";
import { execSync } from "child_process";
import chalk from "chalk";
import * as path from "path";
const { join } = path;

import * as fs from "fs";
const { readFileSync } = fs;

import { parseFullABI } from "@core/abi/abiParser";
import { parseSolidityFile } from "@core/abi/solidityAstParser";
import { advancedSyntaxPlugin } from "@core/plugin/advancedSyntaxPlugin";
import { PluginManager } from "@core/plugin/pluginManager";
import { writeMoveModuleToFile } from "./fileWriter";
import { logger } from "@core/utils/logger";
import { generateMoveModule } from "@core/move/moveGenerator";
import { TranspilerConfig } from "@core/config";

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

async function lintMoveCode(
  moveCode: string,
  contractName: string,
  outputDir: string
): Promise<boolean> {
  const tempPath = path.join(outputDir, `${contractName}.move`);

  fs.writeFileSync(tempPath, moveCode);

  try {
    execSync(`sui move lint ${tempPath}`, { stdio: "ignore" });
    console.log(chalk.green("✅ Move lint passed successfully."));
    return true;
  } catch (e) {
    console.error(chalk.red("❌ Move lint failed. Review generated code."));
    return false;
  }
}

const config = loadTranspilerConfig();

program
  .name("s2m")
  .description(
    "CLI tool to transpile Solidity ABI JSON or source (.sol) file into Move smart contract modules"
  )
  .version("1.0.0");

program
  .command("transpile")
  .description(
    "Transpile Solidity ABI JSON or source (.sol) file into Move smart contract modules"
  )
  .requiredOption("-i, --input <path>", "Input Solidity .sol or ABI .json")
  .requiredOption("-n, --name <contractName>", "Move module name")
  .option("-o, --output <dir>", "Output directory", "output")
  .option("--target <sui|aptos>", "Target Move framework", "sui")
  .option("--strict", "Fail on unsupported syntax")
  .option("-v, --verbose", "Enable verbose logging")
  .option("--dry-run", "Print Move code without saving")
  .option("--dump-ast", "Print parsed AST before generating Move code")
  .option("--skip-lint", "Skip Move lint check")
  .option("--force", "Overwrite existing files")
  .action(async (options) => {
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.output);
    const contractName = options.name;
    const inferredLibs = options.libs || [];
    const verbose = options.verbose || false;
    const dryRun = options.dryRun || false;
    const dumpAst = options.dumpAst || false;
    const force = options.force || false;
    const pluginManager = new PluginManager();
    pluginManager.addPlugin(advancedSyntaxPlugin());

    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(`❌ Input file not found: ${inputPath}`));
      process.exit(1);
    }

    try {
      let moveCode: string;
      let finalContractName = contractName;

      const extension = path.extname(inputPath).toLowerCase();

      if (extension === ".sol") {
        const strictMode = options.strict ?? config.strictMode ?? false;
        const contracts = parseSolidityFile(
          inputPath,
          strictMode,
          pluginManager
        );

        if (verbose) {
          console.log(
            chalk.blue(
              `[VERBOSE] Parsed ${contracts.length} Solidity contracts:`
            )
          );
          contracts.forEach((c) => console.log(` - ${c.contractName}`));
        }

        if (!finalContractName) {
          finalContractName = contracts[0].contractName;
          console.log(
            chalk.yellow(
              `⚠️ No contract name provided. Using default: ${finalContractName}`
            )
          );
        }

        const selectedContract = contracts.find(
          (c) => c.contractName === finalContractName
        );

        if (!selectedContract) {
          throw new Error(`Contract "${finalContractName}" not found in file.`);
        }

        const targetName = options.target || config.target || "sui";

        moveCode = generateMoveModule(
          finalContractName,
          selectedContract.functions,
          [...inferredLibs],
          selectedContract.stateVariables,
          { verbose, target: targetName }
        );

        if (dumpAst) {
          console.log(chalk.cyan("\n=== Dumping AST ===\n"));
          console.log(JSON.stringify(selectedContract, null, 2));
          return;
        }
      } else if (extension === ".json") {
        const { abi, stateVariables } = parseFullABI(inputPath);
        if (pluginManager) pluginManager.runBeforeParseABI(abi);
        if (pluginManager) pluginManager.runAfterParseABI(abi);

        const targetName = options.target || config.target || "sui";
        moveCode = generateMoveModule(
          finalContractName,
          abi,
          [...inferredLibs],
          stateVariables,
          { verbose, target: targetName }
        );

        if (pluginManager)
          pluginManager.runBeforeGenerateMove(finalContractName, abi);
        if (pluginManager)
          moveCode = pluginManager.runAfterGenerateMove(moveCode);
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      if (!dryRun) {
        const filePath = writeMoveModuleToFile(
          finalContractName,
          moveCode,
          outputDir,
          { dryRun, force, verbose }
        );
        let lintPassed = true;

        if (!dryRun && !options.skipLint) {
          lintPassed = await lintMoveCode(
            moveCode,
            finalContractName,
            outputDir
          );
        }

        if (lintPassed && !dryRun) {
          console.log(
            chalk.green(`✅ Successfully generated Move module at: ${filePath}`)
          );
        } else if (!dryRun && !lintPassed) {
          console.warn(chalk.yellow("⚠️ Output may contain errors"));
        }
      } else {
        console.log(chalk.blue("\n--- DRY RUN OUTPUT ---\n"));
        console.log(moveCode);
      }
    } catch (err) {
      logger.error(`Transpilation failed: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

// cli/src/cli.ts
import { Command } from "commander";
import { execSync } from "child_process";
import chalk from "chalk";
import * as path from "path";
const { join } = path;
import dotenv from "dotenv";

import * as fs from "fs";
const { readFileSync } = fs;

import { parseFullABI } from "../../core/src/abi/abiParser";
import { parseSolidityFile } from "../../core/src/abi/solidityAstParser";
import { advancedSyntaxPlugin } from "../../core/src/plugin/advancedSyntaxPlugin";
import { PluginManager } from "../../core/src/plugin/pluginManager";
import { writeMoveModuleToFile } from "./fileWriter";
import { QwenAIService } from "../../core/src/ai/qwenAiService";
import { logger } from "../../core/src/utils/logger";
import { generateMoveModule } from "../../core/src/move/moveGenerator";
import { loadTranspilerConfig } from "../../core/src/config";

dotenv.config();
const program = new Command();
const config = loadTranspilerConfig();
const aiService = new QwenAIService(process.env.QWEN_API_KEY || "");

program
  .name("s2m")
  .description("CLI tool to transpile Solidity into Move smart contracts")
  .version("1.0.0");

program
  .command("transpile")
  .description("Transpile a Solidity or ABI JSON file to Move")
  .requiredOption("-i, --input <path>", "Path to input file (.sol or .json)")
  .requiredOption("-n, --name <contractName>", "Name for generated Move module")
  .option("--target <sui|aptos>", "Target Move framework", "sui")
  .option("--strict", "Fail on unsupported syntax")
  .option("-v, --verbose", "Enable verbose logging")
  .option("--dry-run", "Print Move code without saving")
  .option("--skip-lint", "Skip Move lint check")
  .option("--force", "Overwrite existing files")
  .option(
    "--use-ai",
    "Use AI to transpile Solidity if AST fails or by preference"
  )
  .action(async (options) => {
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.output || "output");
    const useAi = options.useAi || false;
    const contractName = options.name;
    const inferredLibs = options.libs || [];
    const verbose = options.verbose || false;
    const dryRun = options.dryRun || false;
    const force = options.force || false;

    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(`❌ Input file not found: ${inputPath}`));
      process.exit(1);
    }

    try {
      let moveCode: string;
      let finalContractName = contractName;
      const extension = path.extname(inputPath).toLowerCase();
      const pluginManager = new PluginManager();
      pluginManager.addPlugin(advancedSyntaxPlugin());

      const customLibs = {
        ...config?.libraryMappings,
        ...pluginManager?.getAllLibraryOverrides(),
      };

      if (extension === ".sol") {
        if (useAi) {
          const solidityCode = readFileSync(inputPath, "utf8");
          logger.info("⚙️ Using AI service to transpile Solidity to Move...");
          moveCode = await aiService.translateSolidityToMove(solidityCode);
        } else {
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
            throw new Error(
              `Contract "${finalContractName}" not found in file.`
            );
          }

          const targetName = options.target || config.target || "sui";

          moveCode = generateMoveModule(
            finalContractName,
            selectedContract.functions,
            [...inferredLibs, ...Object.keys(customLibs)],
            selectedContract.stateVariables,
            { verbose, target: targetName }
          );

          if (options.dumpAst) {
            console.log(chalk.cyan("\n=== Dumping AST ===\n"));
            console.log(JSON.stringify(selectedContract, null, 2));
            return;
          }
        }
      } else if (extension === ".json") {
        const { abi, stateVariables } = parseFullABI(inputPath);
        pluginManager.runBeforeParseABI(abi);
        pluginManager.runAfterParseABI(abi);

        const targetName = options.target || config.target || "sui";

        moveCode = generateMoveModule(
          finalContractName,
          abi,
          [...inferredLibs],
          stateVariables,
          { verbose, target: targetName }
        );

        pluginManager.runBeforeGenerateMove(finalContractName, abi);
        moveCode = pluginManager.runAfterGenerateMove(moveCode);
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      if (!dryRun) {
        const filePath = await writeMoveModuleToFile(
          finalContractName,
          moveCode,
          outputDir,
          { dryRun, force, verbose }
        );

        let lintPassed = true;
        if (!options.skipLint) {
          lintPassed = await lintMoveCode(
            moveCode,
            finalContractName,
            outputDir
          );
        }

        if (lintPassed) {
          console.log(
            chalk.green(`✅ Successfully generated Move module at: ${filePath}`)
          );
        } else {
          console.warn(chalk.yellow("⚠️ Output may contain errors"));
        }
      } else {
        console.log(chalk.blue("\n--- DRY RUN OUTPUT ---\n"));
        console.log(moveCode);
      }
    } catch (err) {
      const detailedError = await aiService.explainError(
        (err as Error).message
      );
      logger.error(`Transpilation failed: ${detailedError}`);
      process.exit(1);
    }
  });

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

program.parse(process.argv);

import fs from "fs";
import path from "path";
import { logger } from "@core/utils/logger";

/**
 * Writes generated Move module code to a file.
 *
 * @param contractName - Name of the Solidity contract (used for filename)
 * @param moveCode - Generated Move source code
 * @param outputDir - Directory to write the file into
 * @param options - Optional settings: dryRun, force, verbose
 * @returns The full path where the file was written
 */
export function writeMoveModuleToFile(
  contractName: string,
  moveCode: string,
  outputDir: string,
  options: {
    dryRun?: boolean;
    force?: boolean;
    verbose?: boolean;
  } = {}
): string {
  const { dryRun = false, force = false, verbose = false } = options;

  const outputPath = path.join(outputDir, `${contractName}.move`);

  if (dryRun) {
    logger.info("=== DRY RUN - OUTPUT ===");
    logger.verbose(moveCode, true);
    return outputPath;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    logger.info(`📁 Created output directory: ${outputDir}`);
  }

  if (fs.existsSync(outputPath) && !force) {
    logger.error(`File already exists at: ${outputPath}`);
    throw new Error("File exists. Use --force to overwrite.");
  }

  try {
    fs.writeFileSync(outputPath, moveCode, "utf-8");
    logger.success(`✅ Wrote Move module to: ${outputPath}`);
    return outputPath;
  } catch (err) {
    logger.error(
      `Failed to write file to ${outputPath}: ${(err as Error).message}`
    );
    throw err;
  }
}

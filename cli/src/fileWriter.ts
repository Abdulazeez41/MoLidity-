import fs from "fs";
import path from "path";

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
    console.log("=== DRY RUN - OUTPUT ===");
    console.log(moveCode);
    return outputPath;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  if (fs.existsSync(outputPath) && !force) {
    throw new Error(
      `File already exists at ${outputPath}. Use --force to overwrite.`
    );
  }

  fs.writeFileSync(outputPath, moveCode, "utf-8");

  if (verbose) {
    console.log(`✅ Wrote Move module to ${outputPath}`);
  }

  return outputPath;
}

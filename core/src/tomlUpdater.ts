import fs from "fs";

const KNOWN_DEPENDENCIES: Record<string, string> = {
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

export interface TomlUpdaterOptions {
  force?: boolean;
  verbose?: boolean;
}

export function ensureMoveTomlDeps(
  tomlPath: string,
  usedLibs: string[],
  options: TomlUpdaterOptions = {}
): void {
  const { verbose = false } = options;

  if (!fs.existsSync(tomlPath)) {
    throw new Error(`Move.toml not found at ${tomlPath}`);
  }

  let toml = fs.readFileSync(tomlPath, "utf-8");

  const newlyAddedDeps: string[] = [];

  for (const lib of usedLibs) {
    const depSpec = KNOWN_DEPENDENCIES[lib];
    if (!depSpec) {
      console.warn(
        `⚠️ Unknown library requested: ${lib}. Consider adding it manually.`
      );
      continue;
    }

    const sectionHeader = `[dependencies.${lib}]`;
    if (!toml.includes(sectionHeader)) {
      toml += `\n\n${depSpec}`;
      newlyAddedDeps.push(lib);
      if (verbose) {
        console.log(`[VERBOSE] Adding dependency: ${lib}`);
      }
    } else {
      if (verbose) {
        console.log(`[VERBOSE] Skipping existing dependency: ${lib}`);
      }
    }
  }

  if (newlyAddedDeps.length > 0) {
    fs.writeFileSync(tomlPath, toml, "utf-8");
    console.log(
      `✅ Added dependencies to Move.toml: ${newlyAddedDeps.join(", ")}`
    );
  } else {
    if (verbose) {
      console.log(`[VERBOSE] No new dependencies needed`);
    }
  }
}

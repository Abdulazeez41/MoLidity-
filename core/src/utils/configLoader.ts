import fs from "fs";
import path from "path";

export function loadConfig(filePath = "solidity-to-move.config.json") {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  }
  return {};
}

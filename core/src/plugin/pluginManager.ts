import { ABIEntry } from "../types.js";
import { TranspilerPlugin } from "./plugin.js";

export class PluginManager {
  private plugins: TranspilerPlugin[] = [];

  addPlugin(plugin: TranspilerPlugin) {
    this.plugins.push(plugin);
  }

  runBeforeParseABI(rawABI: any[]) {
    this.plugins.forEach((p) => p.beforeParseABI?.(rawABI));
  }

  runAfterParseABI(parsedABI: ABIEntry[]): ABIEntry[] {
    return this.plugins.reduce(
      (acc, p) => p.afterParseABI?.(acc) || acc,
      parsedABI
    );
  }

  runBeforeGenerateMove(contractName: string, abi: ABIEntry[]) {
    this.plugins.forEach((p) => p.beforeGenerateMove?.(contractName, abi));
  }

  runAfterGenerateMove(moveCode: string): string {
    return this.plugins.reduce(
      (acc, p) => p.afterGenerateMove?.(acc) || acc,
      moveCode
    );
  }

  getAllTypeOverrides(): Record<string, string> {
    return this.plugins.reduce(
      (acc, p) => ({
        ...acc,
        ...p.getTypeOverrides?.(),
      }),
      {}
    );
  }

  getAllLibraryOverrides(): Record<string, string> {
    return this.plugins.reduce(
      (acc, p) => ({
        ...acc,
        ...p.getLibraryOverrides?.(),
      }),
      {}
    );
  }
}

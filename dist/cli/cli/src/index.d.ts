import { PluginManager } from "../../core/src/plugin/pluginManager";
import { TranspilerConfig } from "../../core/src/config/config";
export interface TranspileOptions {
    dryRun?: boolean;
    force?: boolean;
    verbose?: boolean;
    config?: TranspilerConfig;
    plugins?: PluginManager;
}
export declare function transpileAbiToMove(inputPath: string, contractName: string, outputDir: string, inferredLibs: string[], options?: TranspileOptions): Promise<string>;

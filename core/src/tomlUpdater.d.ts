export interface TomlUpdaterOptions {
    force?: boolean;
    verbose?: boolean;
}
export declare function ensureMoveTomlDeps(tomlPath: string, usedLibs: string[], options?: TomlUpdaterOptions): void;

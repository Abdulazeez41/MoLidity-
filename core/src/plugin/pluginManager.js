"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
class PluginManager {
    plugins = [];
    addPlugin(plugin) {
        this.plugins.push(plugin);
    }
    runBeforeParseABI(rawABI) {
        this.plugins.forEach((p) => p.beforeParseABI?.(rawABI));
    }
    runAfterParseABI(parsedABI) {
        return this.plugins.reduce((acc, p) => p.afterParseABI?.(acc) || acc, parsedABI);
    }
    runBeforeGenerateMove(contractName, abi) {
        this.plugins.forEach((p) => p.beforeGenerateMove?.(contractName, abi));
    }
    runAfterGenerateMove(moveCode) {
        return this.plugins.reduce((acc, p) => p.afterGenerateMove?.(acc) || acc, moveCode);
    }
    getAllTypeOverrides() {
        return this.plugins.reduce((acc, p) => ({
            ...acc,
            ...p.getTypeOverrides?.(),
        }), {});
    }
    getAllLibraryOverrides() {
        return this.plugins.reduce((acc, p) => ({
            ...acc,
            ...p.getLibraryOverrides?.(),
        }), {});
    }
}
exports.PluginManager = PluginManager;

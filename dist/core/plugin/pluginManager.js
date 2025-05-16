"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
class PluginManager {
    constructor() {
        this.plugins = [];
    }
    addPlugin(plugin) {
        this.plugins.push(plugin);
    }
    runBeforeParseABI(rawABI) {
        this.plugins.forEach((p) => { var _a; return (_a = p.beforeParseABI) === null || _a === void 0 ? void 0 : _a.call(p, rawABI); });
    }
    runAfterParseABI(parsedABI) {
        return this.plugins.reduce((acc, p) => { var _a; return ((_a = p.afterParseABI) === null || _a === void 0 ? void 0 : _a.call(p, acc)) || acc; }, parsedABI);
    }
    runBeforeGenerateMove(contractName, abi) {
        this.plugins.forEach((p) => { var _a; return (_a = p.beforeGenerateMove) === null || _a === void 0 ? void 0 : _a.call(p, contractName, abi); });
    }
    runAfterGenerateMove(moveCode) {
        return this.plugins.reduce((acc, p) => { var _a; return ((_a = p.afterGenerateMove) === null || _a === void 0 ? void 0 : _a.call(p, acc)) || acc; }, moveCode);
    }
    getAllTypeOverrides() {
        return this.plugins.reduce((acc, p) => {
            var _a;
            return (Object.assign(Object.assign({}, acc), (_a = p.getTypeOverrides) === null || _a === void 0 ? void 0 : _a.call(p)));
        }, {});
    }
    getAllLibraryOverrides() {
        return this.plugins.reduce((acc, p) => {
            var _a;
            return (Object.assign(Object.assign({}, acc), (_a = p.getLibraryOverrides) === null || _a === void 0 ? void 0 : _a.call(p)));
        }, {});
    }
}
exports.PluginManager = PluginManager;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadConfig(filePath = "solidity-to-move.config.json") {
    const fullPath = path_1.default.resolve(process.cwd(), filePath);
    if (fs_1.default.existsSync(fullPath)) {
        return JSON.parse(fs_1.default.readFileSync(fullPath, "utf-8"));
    }
    return {};
}

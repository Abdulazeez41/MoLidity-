"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFullABI = parseFullABI;
exports.getFunctionABIs = getFunctionABIs;
const fs = __importStar(require("fs"));
const zod_1 = require("zod");
const abiParameterSchema = zod_1.z.lazy(() => zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.string(),
    components: zod_1.z.array(abiParameterSchema).optional(),
}));
const abiEntrySchema = zod_1.z.object({
    type: zod_1.z.union([
        zod_1.z.literal("function"),
        zod_1.z.literal("event"),
        zod_1.z.literal("constructor"),
        zod_1.z.string(),
    ]),
    name: zod_1.z.string().optional(),
    inputs: zod_1.z.array(abiParameterSchema).optional(),
    outputs: zod_1.z.array(abiParameterSchema).optional(),
    stateMutability: zod_1.z.string().optional(),
    anonymous: zod_1.z.boolean().optional(),
    payable: zod_1.z.boolean().optional(),
    constant: zod_1.z.boolean().optional(),
});
function parseFullABI(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const abi = JSON.parse(raw);
    const validatedAbi = abiEntrySchema.array().parse(abi);
    const stateVariables = [];
    for (const entry of validatedAbi) {
        if (entry.type === "constructor" && Array.isArray(entry.inputs)) {
            for (const param of entry.inputs) {
                if (param.name) {
                    stateVariables.push({ name: param.name, type: param.type });
                }
            }
        }
    }
    return { abi: validatedAbi, stateVariables };
}
function getFunctionABIs(abi) {
    return abi.filter((item) => item.type === "function");
}

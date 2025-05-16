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
exports.SolidityParser = void 0;
exports.parseSolidityFile = parseSolidityFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const solc = __importStar(require("solc"));
class SolidityParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.source = "";
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        this.source = fs.readFileSync(filePath, "utf8");
        this.compileSource();
    }
    compileSource() {
        var _a;
        const input = {
            language: "Solidity",
            sources: {
                [path.basename(this.filePath)]: {
                    content: this.source,
                },
            },
            settings: {
                outputSelection: {
                    "*": {
                        "*": ["*"],
                        "": ["ast"],
                    },
                },
            },
        };
        const output = JSON.parse(solc.compile(JSON.stringify(input)));
        if ((_a = output.errors) === null || _a === void 0 ? void 0 : _a.length) {
            const fatal = output.errors.find((e) => e.severity === "error");
            if (fatal)
                throw new Error(fatal.formattedMessage);
        }
        this.ast = output.sources[Object.keys(output.sources)[0]].ast;
    }
    parseContracts() {
        const contracts = [];
        const nodes = this.ast.nodes || [];
        for (const node of nodes) {
            if (node.nodeType !== "ContractDefinition")
                continue;
            const contractName = node.name;
            const stateVariables = this.extractStateVariables(node);
            const functions = this.extractFunctions(node);
            contracts.push({ contractName, stateVariables, functions });
        }
        return contracts;
    }
    extractStateVariables(contractNode) {
        return (contractNode.nodes || [])
            .filter((n) => n.nodeType === "VariableDeclaration")
            .map((v) => {
            var _a;
            return ({
                name: v.name,
                type: ((_a = v.typeDescriptions) === null || _a === void 0 ? void 0 : _a.typeString) || "unknown",
            });
        });
    }
    extractFunctions(contractNode) {
        return (contractNode.nodes || [])
            .filter((n) => n.nodeType === "FunctionDefinition" && n.body)
            .map((f) => ({
            name: f.name || "(constructor/fallback/receive)",
            visibility: f.visibility,
            mutability: f.stateMutability,
            params: this.extractParameters(f.parameters),
            returns: this.extractParameters(f.returnParameters),
            body: this.extractFunctionBody(f.body),
        }));
    }
    extractParameters(paramsNode) {
        return ((paramsNode === null || paramsNode === void 0 ? void 0 : paramsNode.parameters) || []).map((p) => {
            var _a;
            return ({
                name: p.name,
                type: ((_a = p.typeDescriptions) === null || _a === void 0 ? void 0 : _a.typeString) || "unknown",
            });
        });
    }
    extractFunctionBody(bodyNode) {
        // TODO: Replace with real logic later
        return "// BODY STUBBED";
    }
}
exports.SolidityParser = SolidityParser;
function parseSolidityFile(filePath) {
    const parser = new SolidityParser(filePath);
    return parser.parseContracts();
}

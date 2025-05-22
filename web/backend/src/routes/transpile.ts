import express from "express";
import multer from "multer";
import Mustache from "mustache";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

import { PROMPT_TEMPLATE } from "../../../../core/src/ai/aiPromptTemplates";
import { QwenAIService } from "../../../../core/src/ai/qwenAiService";
import { parseFullABI } from "../../../../core/src/abi/abiParser";
import { parseSolidityFile } from "../../../../core/src/abi/solidityAstParser";
import { PluginManager } from "../../../../core/src/plugin/pluginManager";
import { advancedSyntaxPlugin } from "../../../../core/src/plugin/advancedSyntaxPlugin";
import { generateMoveFromParsedContract } from "../../../../core/src/move/moveGenerator";
import { generateMoveModule } from "../../../../core/src/move/moveGenerator";

dotenv.config();

const router = express.Router();
const ai = new QwenAIService(process.env.QWEN_API_KEY || "");

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fieldSize: Infinity } });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("✅ Received POST /upload");
    const file = req.file;
    const contractName = req.body.name || "TranspiledContract";
    const target = req.body.target || "sui";
    const useAi = req.body.useAi === "true" || true;
    const aiMode = req.body.aiMode || "full";
    const dumpAst = req.body.dumpAst === "true";

    console.log(`📥 Uploaded file: ${file ? file.originalname : "None"}`);
    console.log(`🏷 Contract name: ${contractName}`);
    console.log(`⛓ Target chain: ${target}`);
    console.log(`🧠 Use AI mode: ${useAi} (${aiMode})`);
    console.log(`🔍 Dump AST mode: ${dumpAst}`);

    if (!file) {
      console.warn("⚠️ No file uploaded.");
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    console.log(`📁 File extension detected: "${ext}"`);

    let parsed: any;

    if (ext === ".json") {
      console.log("📄 Parsing JSON ABI...");
      const { abi, stateVariables } = parseFullABI(file.path);
      parsed = [
        {
          contractName,
          baseContracts: [],
          stateVariables,
          functions: abi.filter((entry: any) => entry.type === "function"),
          events: [],
          modifiers: [],
        },
      ];
      console.log(`✅ Parsed ${abi.length} ABI entries`);
    } else if (ext === ".sol") {
      console.log("🔄 Parsing Solidity file...");
      const pluginManager = new PluginManager();
      pluginManager.addPlugin(advancedSyntaxPlugin());

      if (!file.buffer) {
        throw new Error("Uploaded .sol file has no content");
      }

      const tempPath = path.join(__dirname, "../../../../../../temp.sol");
      console.log(`📝 Writing temporary .sol file to: ${tempPath}`);
      fs.writeFileSync(tempPath, file.buffer);

      parsed = parseSolidityFile(tempPath, false, pluginManager);
      console.log(`📦 Parsed ${parsed.length} contracts from Solidity file`);
      fs.unlinkSync(tempPath);
      console.log("🗑 Deleted temporary .sol file");
    } else {
      throw new Error("Unsupported file format");
    }

    console.log("🧹 Cleaning up uploaded file:", file.path);
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    if (dumpAst) {
      console.log("🧾 Returning raw AST instead of Move code");
      res.json({ ast: parsed });
      return;
    }

    console.log("🤖 Using AI to transpile contract...");

    const strippedCode =
      aiMode === "simple"
        ? file.buffer
            .toString()
            .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")
            .trim()
        : file.buffer.toString();

    const prompt = Mustache.render(PROMPT_TEMPLATE, {
      target,
      isSui: target === "sui",
      isAptos: target === "aptos",
      solidityCode: strippedCode,
    });

    const moveCode = await ai.translateSolidityToMove(prompt);

    console.log("✅ Move code generated successfully");

    const outputDir = path.join(__dirname, "../../../../../../output");
    console.log(`📁 Ensuring output directory exists: ${outputDir}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const moveFilePath = path.join(outputDir, `${contractName}.move`);
    console.log(`💾 Saving Move file to: ${moveFilePath}`);
    fs.writeFileSync(moveFilePath, moveCode);
    console.log("📂 File saved.");

    res.status(200).json({ success: true, moveCode });
  } catch (err: any) {
    const explanation = await ai.explainError(err.message);
    console.error("❌ ERROR in transpile route:");
    console.error(err.stack || err.message);
    res.status(500).json({ success: false, error: explanation });
  }
});

router.post("/explain-error", async (req, res) => {
  const { message } = req.body;
  const response = await ai.explainError(message);
  res.json({ explanation: response });
});

export default router;

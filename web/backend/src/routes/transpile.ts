import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { parseFullABI } from "../../../../core/src/abi/abiParser";
import { parseSolidityFile } from "../../../../core/src/abi/solidityAstParser";
import { PluginManager } from "../../../../core/src/plugin/pluginManager";
import { advancedSyntaxPlugin } from "../../../../core/src/plugin/advancedSyntaxPlugin";
import { generateMoveFromParsedContract } from "../../../../core/src/move/moveGenerator";

const router = express.Router();
const upload = multer({ dest: "uploads/", limits: { fieldSize: Infinity } });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const contractName = req.body.name || "TranspiledContract";
    const target = req.body.target || "sui";
    const dumpAst = req.body.dumpAst === "true";

    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();

    let parsed: any;

    if (ext === ".json") {
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
    } else if (ext === ".sol") {
      const pluginManager = new PluginManager();
      pluginManager.addPlugin(advancedSyntaxPlugin());

      const tempPath = path.join(__dirname, "../../../../../../temp.sol");
      fs.writeFileSync(tempPath, file.buffer);

      parsed = parseSolidityFile(tempPath, false, pluginManager);
      fs.unlinkSync(tempPath);
    } else {
      throw new Error(
        "Unsupported file format. Only .json and .sol are allowed."
      );
    }

    fs.unlinkSync(file.path);

    if (dumpAst) {
      res.json({ ast: parsed });
      return;
    }

    const moveCode = generateMoveFromParsedContract(parsed);

    const outputDir = path.join(__dirname, "../../../../../../output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const moveFilePath = path.join(outputDir, `${contractName}.move`);
    fs.writeFileSync(moveFilePath, moveCode);

    res.status(200).json({ moveCode });
  } catch (err: any) {
    console.error("Transpile Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

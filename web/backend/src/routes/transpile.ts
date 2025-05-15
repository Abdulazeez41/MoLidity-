import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { parseFullABI } from "@core/abi/abiParser";
import { parseSolidityFile } from "@core/abi/solidityAstParser";
import {
  generateMove,
  generateMoveFromParsedContract,
} from "@core/move/moveGenerator";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/transpile", upload.single("file"), async (req, res) => {
  const file = req.file;
  const contractName = req.body.name || "TranspiledContract";

  if (!file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  const ext = path.extname(file.originalname);
  let moveCode: string;

  try {
    if (ext === ".json") {
      const abiJson = JSON.parse(fs.readFileSync(file.path, "utf8"));
      const parsed = parseFullABI(abiJson);
      moveCode = generateMove(parsed);
    } else if (ext === ".sol") {
      const parsed = await parseSolidityFile(file.path);
      if (!parsed) throw new Error("Failed to parse .sol file");
      moveCode = generateMoveFromParsedContract(parsed);
    } else {
      throw new Error(
        "Unsupported file format. Only .json and .sol are allowed."
      );
    }

    const outputDir = path.join(__dirname, "../../../output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const moveFilePath = path.join(outputDir, `${contractName}.move`);
    fs.writeFileSync(moveFilePath, moveCode);

    fs.unlinkSync(file.path);
    res.status(200).json({ moveCode });
  } catch (err: any) {
    console.error("Transpile Error:", err.message);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

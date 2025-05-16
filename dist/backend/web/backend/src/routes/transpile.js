"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const abiParser_1 = require("../../../../core/src/abi/abiParser");
const solidityAstParser_1 = require("../../../../core/src/abi/solidityAstParser");
const moveGenerator_1 = require("../../../../core/src/move/moveGenerator");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
  dest: "uploads/",
  limits: { fieldSize: Infinity },
});
router.post("/upload", upload.single("file"), (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const file = req.file;
      const contractName = req.body.name || "TranspiledContract";
      if (!file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
      }
      const ext = path_1.default.extname(file.originalname);
      let moveCode;
      if (ext === ".json") {
        const abiJson = JSON.parse(
          fs_1.default.readFileSync(file.path, "utf8")
        );
        const parsed = (0, abiParser_1.parseFullABI)(abiJson);
        moveCode = (0, moveGenerator_1.generateMove)(parsed);
      } else if (ext === ".sol") {
        const parsed = yield (0, solidityAstParser_1.parseSolidityFile)(
          file.path
        );
        if (!parsed) throw new Error("Failed to parse .sol file");
        moveCode = (0, moveGenerator_1.generateMoveFromParsedContract)(parsed);
      } else {
        throw new Error(
          "Unsupported file format. Only .json and .sol are allowed."
        );
      }
      const outputDir = path_1.default.join(
        __dirname,
        "../../../../../../output"
      );
      if (!fs_1.default.existsSync(outputDir))
        fs_1.default.mkdirSync(outputDir);
      const moveFilePath = path_1.default.join(
        outputDir,
        `${contractName}.move`
      );
      fs_1.default.writeFileSync(moveFilePath, moveCode);
      fs_1.default.unlinkSync(file.path);
      res.status(200).json({ moveCode });
    } catch (err) {
      console.error("Transpile Error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  })
);
exports.default = router;

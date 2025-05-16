"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const transpile_1 = __importDefault(require("./routes/transpile"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// app.use(fileUpload());
app.use("/output", express_1.default.static(path_1.default.join(__dirname, "../../../../../output")));
app.use("/api/transpile", transpile_1.default);
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

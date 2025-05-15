import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import path from "path";
import transpileRoute from "./routes/transpile";

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use("/output", express.static(path.join(__dirname, "../../output")));

app.use("/api/transpile", transpileRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

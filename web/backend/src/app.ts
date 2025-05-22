import express from "express";
import cors from "cors";
import path from "path";
import transpileRoute from "./routes/transpile";

const app = express();

app.use(cors(
    {
        origin: [
        "http://localhost:3000",
        "https://s2m-x10h.onrender.com",
        "https://s2-m-frontend.vercel.app",
        "https://s2m-frontend.vercel.app",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
));
app.use(express.json());

app.use(
  "/output",
  express.static(path.join(__dirname, "../../../../../output"))
);

app.use("/api/transpile", transpileRoute);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

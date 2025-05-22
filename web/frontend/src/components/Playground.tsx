import * as React from "react";
import { useState } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export const Playground: React.FC = () => {
  // State
  const [solidityCode, setSolidityCode] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [moveCode, setMoveCode] = useState<string | null>(null);
  const [target, setTarget] = useState<"sui" | "aptos">("sui");
  const [useAi, setUseAi] = useState<boolean>(true);
  const [aiMode, setAiMode] = useState<"full" | "simple">("full");
  const [errorExplanation, setErrorExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Handle transpilation request
   */
  const handleTranspile = async () => {
    if (!solidityCode.trim() && !uploadedFile) {
      setErrorExplanation(
          "Please enter Solidity code or upload a .sol/.json file."
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // If the user pasted code, create a temporary file
      if (solidityCode.trim()) {
        const blob = new Blob([solidityCode], { type: "text/plain" });
        const tempFile = new File([blob], "PastedCode.sol", { type: "text/plain" });
        formData.append("file", tempFile); // Append the temporary file
      }

      // If the user uploaded a file, append it directly
      if (uploadedFile) {
        formData.append("file", uploadedFile);
      }

      // Add additional metadata
      formData.append("name", uploadedFile?.name || "AutoContract");
      formData.append("target", target);
      formData.append("useAi", useAi.toString());
      formData.append("aiMode", aiMode);

      // Send the request to the backend
      const res = await axios.post(
          `${"http://localhost:8000"}/api/transpile/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data", // Important for file uploads
            },
          }
      );

      setMoveCode(res.data.moveCode);
      setErrorExplanation("");
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || "Unknown error occurred.";
      setErrorExplanation(errorMsg);

      try {
        const explainRes = await axios.post(
            `${"http://localhost:8000"}/api/transpile/explain-error`,
            { message: errorMsg }
        );
        setErrorExplanation(explainRes.data.explanation || errorMsg);
      } catch {
        // fallback
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle file change event
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith(".sol") || file.name.endsWith(".json"))) {
      const reader = new FileReader();
      reader.onload = () => {
        setSolidityCode(reader.result as string);
        setUploadedFile(file);
      };
      reader.readAsText(file);
    } else {
      alert("Only .sol and .json files are supported.");
    }
  };

  /**
   * Handle download of generated Move code
   */
  const handleDownload = () => {
    if (!moveCode) return;

    const blob = new Blob([moveCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GeneratedContract.move";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
      <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/assets/S2M.png" alt="S2M Logo" className="w-[200px] h-25 object-contain" />
          <h1 className="text-4xl font-extrabold text-center">
            AI-Powered Transpiler
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            Test AI-generated Move contracts
          </p>
        </div>

        {/* Main Card */}
        <main className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
          {/* File Upload Input */}
          <div className="mb-6">
            <label htmlFor="file-upload" className="block mb-2 font-medium">
              Upload .sol or .json file:
            </label>
            <input
                id="file-upload"
                type="file"
                accept=".sol,.json"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white cursor-pointer"
            />
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <label htmlFor="solidity-input" className="block mb-2 font-medium">
              OR Paste Solidity Code:
            </label>
            <textarea
                id="solidity-input"
                rows={10}
                value={solidityCode}
                onChange={(e) => setSolidityCode(e.target.value)}
                placeholder="Paste your Solidity contract here..."
                className="w-full px-4 py-3 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">AI Mode</label>
              <select
                  value={aiMode}
                  onChange={(e) => setAiMode(e.target.value as "full" | "simple")}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
              >
                <option value="full">Full Code</option>
                <option value="simple">Strip Comments</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Target Chain</label>
              <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as "sui" | "aptos")}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
              >
                <option value="sui">Sui</option>
                <option value="aptos">Aptos</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={useAi}
                    onChange={() => setUseAi(!useAi)}
                    className="w-4 h-4"
                />
                <span>Use AI</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
                onClick={handleTranspile}
                disabled={loading}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    loading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {loading ? "Processing..." : "🧠 Transpile"}
            </button>

            {moveCode && (
                <button
                    onClick={handleDownload}
                    className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 font-semibold transition-all"
                >
                  📥 Download .move
                </button>
            )}
          </div>

          {/* Error Explanation */}
          {errorExplanation && (
              <div className="bg-red-900/30 border-l-4 max-w-3xl overflow-hidden border-red-500 text-red-200 p-4 rounded mb-6">
                <h3 className="text-lg font-semibold mb-2">🚨 AI Explanation</h3>
                <SyntaxHighlighter
                    language="rust"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "14px",
                      maxHeight: "500px",
                      overflow: "auto",
                    }}
                >
                  {errorExplanation}
                </SyntaxHighlighter>
              </div>
          )}

          {/* Output Section */}
          {moveCode && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3">
                  ✅ Generated Move Code:
                </h3>
                <div className="rounded-md overflow-hidden border border-gray-600 bg-gray-900">
                  <SyntaxHighlighter
                      language="rust"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: "1rem",
                        fontSize: "14px",
                        maxHeight: "500px",
                        overflow: "auto",
                      }}
                  >
                    {moveCode}
                  </SyntaxHighlighter>
                </div>
              </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-6 text-sm text-gray-500 text-center">
          <p>🛠️ Powered by AI & AST • TypeScript • Move • Sui</p>
        </footer>
      </div>
  );
};

import * as React from "react";
import { useState } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [contractName, setContractName] = useState("");
  const [target, setTarget] = useState<"sui" | "aptos">("sui");
  const [dumpAst, setDumpAst] = useState(false);
  const [moveCode, setMoveCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !contractName) {
      setError("Please select a file and enter a contract name.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", contractName);
    formData.append("target", target);
    formData.append("dumpAst", dumpAst.toString());

    setLoading(true);
    try {
      const response = await axios.post(
        "https://s2m-x10h.onrender.com/api/transpile/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200 && response.data.moveCode) {
        setMoveCode(response.data.moveCode);
        setError("");
      } else if (response.data.ast) {
        setMoveCode(JSON.stringify(response.data.ast, null, 2));
        setError("");
      } else {
        setError("Transpilation failed.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!moveCode || !contractName) return;

    const blob = new Blob([moveCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${contractName}.move`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center p-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <img src="/assets/S2M.png" alt="S2M Logo" className="w-[200px] h-25 object-contain" />
        <h1 className="text-4xl font-extrabold text-center">
          Solidity to Move Transpiler
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          Convert Solidity smart contracts to Move (Sui).
        </p>
      </div>

      {/* Main Card */}
      <main className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        {/* Contract Name Input */}
        <div className="mb-6">
          <label htmlFor="contract-name" className="block mb-2 font-medium">
            Enter Contract Name:
          </label>
          <input
            id="contract-name"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            placeholder="MyToken"
            className="w-full px-4 py-3 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label htmlFor="file-upload" className="block mb-2 font-medium">
            Upload .sol or .json file:
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".sol,.json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white cursor-pointer"
          />
        </div>

        {/* Framework Selection */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Select Target Framework:
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as "sui" | "aptos")}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          >
            <option value="sui">Sui</option>
            <option value="aptos">Aptos</option>
          </select>
        </div>

        {/* Dump AST Checkbox */}
        <div className="mb-6 flex items-center gap-2">
          <input
            type="checkbox"
            checked={dumpAst}
            onChange={() => setDumpAst(!dumpAst)}
            id="dump-ast"
            className="w-4 h-4"
          />
          <label htmlFor="dump-ast">Dump AST instead of Move code</label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : "Upload & Transpile"}
          </button>

          {moveCode && !dumpAst && (
            <button
              onClick={handleDownload}
              className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 font-semibold transition-all"
            >
              Download .move
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Output Section */}
        {moveCode && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">
              {dumpAst ? "Parsed AST Output" : "Generated Move Code:"}
            </h3>
            <div className="rounded-md overflow-hidden border border-gray-600 bg-gray-900">
              <SyntaxHighlighter
                language={dumpAst ? "json" : "rust"}
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
        <p>🛠️ Developed by blockchain engineers with TypeScript • Move • Sui</p>
      </footer>
    </div>
  );
};

export default FileUploader;

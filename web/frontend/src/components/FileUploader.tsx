import React, { useState } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [contractName, setContractName] = useState("");
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

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/transpile/upload/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200 && response.data.moveCode) {
        setMoveCode(response.data.moveCode);
        setError("");
      } else {
        setError("Transpilation failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center overflow-hidden items-center p-6">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold">📝 Blockchain Transpiler</h1>
        <p className="text-xl mt-2">
          Upload your Solidity or ABI JSON file and get Move smart contract
          code.
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-md p-6">
        {/* Input Section */}
        <div className="mb-6">
          <label htmlFor="contract-name" className="block mb-2 font-medium">
            Enter Contract Name:
          </label>
          <input
            type="text"
            id="contract-name"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-700 text-black rounded focus:outline-none focus:border-blue-500 "
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label htmlFor="file-upload" className="block mb-2 font-medium">
            Upload .sol or .json File:
          </label>
          <input
            type="file"
            id="file-upload"
            accept=".sol, .json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              loading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-medium`}
          >
            {loading ? "Processing..." : "Upload & Transpile"}
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Generated Move Code */}
        {moveCode && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Generated Move Code:</h3>
            <SyntaxHighlighter
              language="rust"
              style={vscDarkPlus}
              customStyle={{
                borderRadius: "8px",
                fontSize: "14px",
                maxHeight: "500px",
                overflow: "auto",
              }}
              wrapLines
            >
              {moveCode}
            </SyntaxHighlighter>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-6 text-sm text-gray-400">
        <p>
          🛠️ Powered by Move | For Blockchain Developers | Built using
          Typescript & Move Language
        </p>
      </footer>
    </div>
  );
};

export default FileUploader;

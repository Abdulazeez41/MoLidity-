import React, { useState } from "react";
import axios from "axios";

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [contractName, setContractName] = useState("");
  const [resultPath, setResultPath] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file || !contractName) {
      setError("Please select a file and enter a contract name.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", contractName);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/transpile",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        setResultPath(response.data.moveFilePath);
        setError("");
      } else {
        setError("Transpilation failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during upload.");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Solidity to Move Transpiler</h2>
      <input
        type="text"
        placeholder="Enter Contract Name"
        value={contractName}
        onChange={(e) => setContractName(e.target.value)}
        style={{ marginBottom: 10, width: "100%" }}
      />
      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ marginBottom: 10 }}
      />
      <br />
      <button onClick={handleUpload} style={{ padding: "6px 12px" }}>
        Upload & Transpile
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {resultPath && (
        <div style={{ marginTop: 20 }}>
          <p>✅ Transpilation successful!</p>
          <a
            href={`http://localhost:5000${resultPath}`}
            target="_blank"
            rel="noreferrer"
          >
            Download Generated Move File
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

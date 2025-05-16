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
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Blockchain Transpiler</h1>
        <h2 style={styles.subtitle}>Solidity to Move Transpiler</h2>
        <p style={styles.description}>
          Upload your Solidity or ABI JSON file and get Move smart contract code
          powered by AI.
        </p>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Upload Your Contract</h3>

          <input
            type="text"
            placeholder="Enter Contract Name"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            style={styles.input}
          />

          <input
            type="file"
            accept=".sol, .json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ ...styles.input, padding: "10px" }}
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: loading ? "#777" : "#4f46e5",
            }}
          >
            {loading ? "Processing..." : "Upload & Transpile"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Output Section */}
        {moveCode && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Generated Move Code</h3>
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
      <footer style={styles.footer}>
        <p>
          🛠️ Powered by Move | For Blockchain Developers | Built using
          Typescript & Move Language
        </p>
      </footer>
    </div>
  );
};

// 💡 Styles Object
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
    display: "flex",
    // gridTemplateRows: "1fr 1fr 1fr",
    // gridTemplateColumns: "1fr 1fr 1fr",
    flexDirection: "column",
    gap: "20px",
    padding: "20px",
    boxSizing: "border-box",
    margin: "0 auto",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#111827",
  },
  header: {
    textAlign: "center",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "white",
    width: "100%",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
  },
  subtitle: {
    margin: "10px 0 0",
    fontSize: "1.2rem",
    fontWeight: "normal",
  },
  description: {
    marginTop: "10px",
    fontSize: "1rem",
    maxWidth: "600px",
    marginInline: "auto",
  },
  main: {
    width: "100%",
    maxWidth: "800px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
  },
  card: {
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    padding: "20px",
  },
  sectionTitle: {
    marginBottom: "15px",
    fontSize: "1.1rem",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
  footer: {
    textAlign: "center",
    padding: "20px",
    fontSize: "0.9rem",
    color: "#6b7280",
    borderTop: "1px solid #e5e7eb",
    width: "100%",
  },
};

export default FileUploader;

import React, { useState } from "react";
import { FileUploader } from "./FileUploader";
import { Playground } from "./Playground";

export const App: React.FC = () => {
  const [view, setView] = useState<"upload" | "playground">("upload");

  return (
    <div>
      <nav className="mb-6 text-center">
        <button
          onClick={() => setView("upload")}
          className={`mx-2 px-4 py-2 ${
            view === "upload" ? "font-bold underline" : ""
          }`}
        >
          📁 File Upload
        </button>
        <button
          onClick={() => setView("playground")}
          className={`mx-2 px-4 py-2 ${
            view === "playground" ? "font-bold underline" : ""
          }`}
        >
          🤖 AI Playground
        </button>
      </nav>

      {view === "upload" ? <FileUploader /> : <Playground />}
    </div>
  );
};

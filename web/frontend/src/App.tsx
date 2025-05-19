import React from "react";
import FileUploader from "./components/FileUploader";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FileUploader />
    </div>
  );
};

export default App;

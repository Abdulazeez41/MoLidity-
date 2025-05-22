import * as React from "react";
import FileUploader from "./components/FileUploader";
import Toggle from "./components/Toggle";

const App: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-gray-900 text-white">

      <Toggle />
    </div>
  );
};

export default App;

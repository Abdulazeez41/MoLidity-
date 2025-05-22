import * as React from "react";
import FileUploader from "./FileUploader";
import { Playground } from "./Playground";

export const Toggle: React.FC = () => {
    const [view, setView] = React.useState<"upload" | "playground">(
        () => (localStorage.getItem("view") as "upload" | "playground") || "upload"
    );

    const handleViewChange = (newView: "upload" | "playground") => {
        setView(newView);
        localStorage.setItem("view", newView); // Persist the view in localStorage
    };

    return (
        <div>
            {/* Navigation Buttons */}
            <nav className="mb-6 py-6 text-center">
                <button
                    onClick={() => handleViewChange("upload")}
                    className={`mx-2 px-4 py-2 rounded-md transition-all ${
                        view === "upload"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100/10 text-white hover:bg-gray-300/80"
                    }`}
                >
                    📁 File Upload
                </button>
                <button
                    onClick={() => handleViewChange("playground")}
                    className={`mx-2 px-4 py-2 rounded-md transition-all ${
                        view === "playground"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100/10 text-white hover:bg-gray-300/80"
                    }`}
                >
                    🤖 AI Playground
                </button>
            </nav>

            {/* Conditional Rendering */}
            {view === "upload" ? <FileUploader /> : <Playground />}
        </div>
    );
};

export default Toggle;

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Mounting React App...");
const rootElement = document.getElementById("root");
if (!rootElement) {
    console.error("Root element not found!");
} else {
    createRoot(rootElement).render(<App />);
    console.log("React App mounted successfully.");
}

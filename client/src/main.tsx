import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nProvider } from "@/lib/i18n";

console.log("Mounting React App...");
const rootElement = document.getElementById("root");
if (!rootElement) {
    console.error("Root element not found!");
} else {
    createRoot(rootElement).render(
        <I18nProvider>
            <App />
        </I18nProvider>
    );
    console.log("React App mounted successfully.");
}

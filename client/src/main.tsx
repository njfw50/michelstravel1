import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nProvider } from "@/lib/i18n";

(async function clearOldCaches() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }
    }
  } catch (_) {}
})();

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

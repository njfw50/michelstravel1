import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "pt" | "en" | "es";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

import pt from "../locales/pt.json";
import en from "../locales/en.json";
import es from "../locales/es.json";

const translations: Record<Language, Record<string, string>> = {
  pt,
  en,
  es,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // default language so nada fica null
  const [language, setLanguageState] = useState<Language>("pt");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("michels-travel-lang") as Language | null;
    const browser = (navigator.language || navigator.languages?.[0] || "pt").toLowerCase();
    const inferred: Language =
      saved && (saved === "pt" || saved === "en" || saved === "es")
        ? saved
        : browser.startsWith("es")
          ? "es"
          : browser.startsWith("en")
            ? "en"
            : "pt";
    setLanguageState(inferred);
    document.documentElement.lang = inferred === "pt" ? "pt-BR" : inferred === "es" ? "es" : "en";
    setIsLoading(false);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("michels-travel-lang", lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en";
  };

  // Síncrono, sem chamadas externas: fallback para EN ou key
  const t = (key: string) => {
    const lang = language || "pt";
    const value = translations[lang]?.[key];
    if (value) return value;
    const fallbackEn = translations.en?.[key];
    if (fallbackEn) return fallbackEn;
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing key "${key}" for lang "${lang}"`);
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a I18nProvider");
  return ctx;
}

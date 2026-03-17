import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [language, setLanguageState] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem("michels-travel-lang") as Language;
    if (savedLang && (savedLang === "pt" || savedLang === "en" || savedLang === "es")) {
      setLanguageState(savedLang);
      const htmlLang = savedLang === "pt" ? "pt-BR" : savedLang === "es" ? "es" : "en";
      document.documentElement.lang = htmlLang;
    } else {
      document.documentElement.lang = "pt-BR";
    }
    setIsLoading(false);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("michels-travel-lang", lang);
    const htmlLang = lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en";
    document.documentElement.lang = htmlLang;
  };

  const t = (key: string) => {
    const lang = language || "pt"; // Default to Portuguese if not set (though modal should force set)
    return translations[lang][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language: language as Language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within a I18nProvider");
  }
  return context;
}

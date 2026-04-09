import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "pt" | "en" | "es";

interface I18nContextType {
  language: Language | null;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
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
  // Inicialização síncrona para evitar flash de idioma padrão
  const [language, setLanguageState] = useState<Language | null>(() => {
    if (typeof window === "undefined") return "pt";
    const saved = localStorage.getItem("michels-travel-lang") as Language | null;
    if (saved && (saved === "pt" || saved === "en" || saved === "es")) return saved;
    return null; // Retorna null para mostrar seletor se não houver preferência
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language) {
      document.documentElement.lang = language === "pt" ? "pt-BR" : language === "es" ? "es" : "en";
    }

    // Ouvinte para sincronizar entre abas/janelas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "michels-travel-lang" && e.newValue) {
        const newLang = e.newValue as Language;
        if (newLang !== language) {
          setLanguageState(newLang);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("michels-travel-lang", lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en";
  };

  const t = (key: string, params?: Record<string, any>) => {
    const lang = language || "pt";
    let value = translations[lang]?.[key];
    if (!value) {
      value = translations.en?.[key];
    }
    
    if (!value) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] missing key "${key}" for lang "${lang}"`);
      }
      return key;
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    
    return value;
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

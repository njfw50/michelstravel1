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

const translations: Record<Language, any> = { pt, en, es };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(() => {
    if (typeof window === "undefined") return "pt";
    const saved = localStorage.getItem("michels-travel-lang") as Language | null;
    if (saved && ["pt", "en", "es"].includes(saved)) return saved;

    // ADIÇÃO: Detecção automática do navegador
    const browserLang = navigator.language.split("-")[0] as Language;
    if (["pt", "en", "es"].includes(browserLang)) return browserLang;

    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language) {
      document.documentElement.lang = language === "pt" ? "pt-BR" : language === "es" ? "es" : "en";
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "michels-travel-lang" && e.newValue) {
        const newLang = e.newValue as Language;
        if (newLang !== language) setLanguageState(newLang);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setIsLoading(true); // ADIÇÃO: Feedback visual de carregamento
    setLanguageState(lang);
    localStorage.setItem("michels-travel-lang", lang);

    // Simula um pequeno delay para processamento (opcional)
    setTimeout(() => setIsLoading(false), 300);
  };

  const t = (key: string, params?: Record<string, any>) => {
    const lang = language || "pt";

    // ADIÇÃO: Suporte para chaves aninhadas (ex: "home.welcome.title")
    // Mantém compatibilidade com chaves planas que contêm pontos (ex: "admin.welcome")
    const getNestedValue = (obj: any, path: string) => {
      // Tenta primeiro a chave exata
      if (obj && obj[path]) return obj[path];
      // Se não encontrar, tenta navegar no objeto aninhado
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    let value = getNestedValue(translations[lang], key);

    if (!value) {
      value = getNestedValue(translations.en, key);
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
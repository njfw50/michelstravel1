import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

// 1. Tipagem Automática: O TS lê seu JSON para saber quais chaves existem
import pt from "../locales/pt.json";
import en from "../locales/en.json";
import es from "../locales/es.json";

type Language = "pt" | "en" | "es";
const translations: Record<Language, any> = { pt, en, es };

// Simplificado para evitar estouro de recursividade no build de produção
type TranslationKeys = string;

interface I18nContextType {
  language: Language; 
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Inicialização segura para SSR e Navegador
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "pt";
    const saved = localStorage.getItem("michels-travel-lang") as Language;
    if (["pt", "en", "es"].includes(saved)) return saved;

    const browserLang = navigator.language.split("-")[0] as Language;
    return ["pt", "en", "es"].includes(browserLang) ? browserLang : "pt";
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language === "pt" ? "pt-BR" : language;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "michels-travel-lang" && e.newValue) {
        const newLang = e.newValue as Language;
        if (newLang !== language && ["pt", "en", "es"].includes(newLang)) {
          setLanguageState(newLang);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setIsLoading(true);
    setLanguageState(lang);
    localStorage.setItem("michels-travel-lang", lang);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // 2. Função de tradução otimizada com Memo e busca eficiente
  const t = useCallback((key: TranslationKeys | string, params?: Record<string, string | number>) => {
    const getNestedValue = (obj: any, path: string) => {
      if (obj && obj[path]) return obj[path];
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const value = getNestedValue(translations[language], key);

    if (typeof value !== "string") {
      if (import.meta.env && !import.meta.env.PROD) {
        console.warn(`[I18n Integrity] Key "${key}" not found or not a string in [${language}]`);
      }
      return key; // Retorna a chave em vez de vazio para não quebrar o layout
    }

    // 3. Substituição de variáveis sem criar instâncias de RegExp em loop (Performance)
    if (params) {
      return value.replace(/{(\w+)}/g, (_: string, k: string) => {
        return params[k]?.toString() ?? `{${k}}`;
      });
    }

    return value;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isLoading
  }), [language, setLanguage, t, isLoading]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n deve ser usado dentro de um I18nProvider");
  return ctx;
}
import { useEffect } from "react";
import { useI18n } from "./i18n";

/**
 * Módulo de Prevenção Linguística
 * Garante que o conteúdo exibido respeite estritamente o idioma selecionado.
 */

export interface IntegrityOptions {
  strict?: boolean;
  onViolation?: (violation: string) => void;
}

export function useLanguageIntegrity(options: IntegrityOptions = {}) {
  const { language } = useI18n();
  const { strict = true, onViolation } = options;

  useEffect(() => {
    if (!language) return;

    // Detecta inconsistência entre o idioma do documento e o selecionado
    const docLang = document.documentElement.lang.split("-")[0];
    const bodyLang = document.body.getAttribute("lang")?.split("-")[0];
    const currentLang = language;

    if ((docLang && docLang !== currentLang) || (bodyLang && bodyLang !== currentLang)) {
       console.warn(`[Integridade Linguística] Inconsistência detectada: Doc=${docLang}, Body=${bodyLang}, Escolhido=${currentLang}`);
       if (onViolation) onViolation("document_mismatch");
    }

    // Sincroniza atributos globais
    document.documentElement.lang = currentLang === "pt" ? "pt-BR" : currentLang === "es" ? "es" : "en";
    document.body.setAttribute("lang", currentLang === "pt" ? "pt-BR" : currentLang === "es" ? "es" : "en");
    
    // Configura metatags de idioma dinamicamente para SEO e Acessibilidade
    const metaNames = ["language", "content-language"];
    metaNames.forEach(name => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", language);
    });

  }, [language, onViolation]);

  /**
   * Filtra uma lista de itens baseado no campo de idioma.
   * Se strict for true, remove itens que não correspondem ao idioma atual.
   */
  const enforceExclusivity = <T extends { language?: string; lang?: string }>(items: T[]): T[] => {
    if (!language || !strict) return items;
    
    return items.filter(item => {
      const itemLang = item.language || item.lang || "pt";
      return itemLang === language;
    });
  };

  /**
   * Valida se um determinado bloco de texto parece pertencer ao idioma correto
   * (Heurística básica para prevenção de vazamento linguístico)
   */
  const validateText = (text: string): boolean => {
    if (!text || !language) return true;
    
    // Exemplos de palavras "espiãs" que indicam vazamento comum
    const leakageMap: Record<string, string[]> = {
      pt: ["Welcome", "Search", "Book now", "Flight", "Check-in"],
      en: ["Bem-vindo", "Pesquisar", "Reserve agora", "Voo", "Atendimento"],
      es: ["Bem-vindo", "Welcome", "Search", "Pesquisar"]
    };

    const leaks = leakageMap[language] || [];
    const hasLeak = leaks.some(leak => text.includes(leak));
    
    if (hasLeak) {
       console.error(`[Integridade Linguística] Vazamento detectado no idioma ${language}: "${text.substring(0, 30)}..."`);
       if (onViolation) onViolation("leak_detected");
       return false;
    }
    
    return true;
  };

  return {
    enforceExclusivity,
    validateText,
    currentLanguage: language
  };
}

/**
 * Utilitário para formatação de datas respeitando a integridade
 */
export function getLocaleForIntegrity(lang: string | null) {
  switch (lang) {
    case "pt": return "pt-BR";
    case "es": return "es-ES";
    default: return "en-US";
  }
}

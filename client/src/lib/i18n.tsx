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

// Minidicionário de fallback para casos críticos
const miniDictionary: Record<string, Record<string, string>> = {
  pt: {
    "results.senior_title": "Resultados para idosos",
    "results.senior_description": "Veja as melhores opções para sua viagem com conforto e segurança.",
    "results.senior_badge": "Atendimento Senior",
    // Adicione outras chaves essenciais aqui
  },
  en: {
    "results.senior_title": "Senior results",
    "results.senior_description": "See the best options for your trip with comfort and safety.",
    "results.senior_badge": "Senior Support",
  },
  es: {
    "results.senior_title": "Resultados para mayores",
    "results.senior_description": "Vea las mejores opciones para su viaje con comodidad y seguridad.",
    "results.senior_badge": "Atención Senior",
  },
};

// Função para buscar tradução online usando OpenAI API
async function fetchOnlineTranslation(key: string, lang: Language): Promise<string> {
  // Exemplo de prompt para tradução automática
  const prompts: Record<Language, string> = {
    pt: `Traduza para português brasileiro a seguinte frase ou chave de interface de site de viagens: "${key}". Responda apenas com o texto traduzido, sem explicações.`,
    en: `Translate to English (US) the following travel website UI key or phrase: "${key}". Respond only with the translated text, no explanations.`,
    es: `Traduce al español la siguiente clave o frase de interfaz de sitio de viajes: "${key}". Responde solo con el texto traducido, sin explicaciones.`
  };
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY || "SUA_CHAVE_AQUI"}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Você é um tradutor de interface de site de viagens." },
          { role: "user", content: prompts[lang] }
        ],
        max_tokens: 60,
        temperature: 0.2
      })
    });
    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content?.trim();
    return translation || `Tradução automática indisponível para: ${key}`;
  } catch (e) {
    console.error("Erro ao buscar tradução automática OpenAI:", e);
    return `Tradução automática indisponível para: ${key}`;
  }
}

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

  // t pode ser síncrona, mas se não encontrar, retorna do minidicionário ou chama busca online (assíncrona)
  const t = (key: string) => {
    const lang = language || "pt";
    let value = translations[lang][key];
    if (value) return value;
    value = miniDictionary[lang]?.[key];
    if (value) return value;
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Chave de tradução ausente: "${key}" para o idioma "${lang}"`);
    }
    // Busca online (assíncrona) - retorna placeholder e dispara busca
    fetchOnlineTranslation(key, lang).then(trad => {
      // Aqui você pode atualizar o estado global/contexto para exibir a tradução assim que chegar
      // Exemplo: mostrar um toast, atualizar cache, etc.
      console.info(`[i18n] Tradução online recebida para "${key}": ${trad}`);
    });
    return "Carregando tradução...";
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

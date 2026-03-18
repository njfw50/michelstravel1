// Utilitário para forçar uso do dicionário de tradução em ambiente de desenvolvimento
export function enforceI18n(text: string, key?: string) {
  if (process.env.NODE_ENV !== "production") {
    if (!key) {
      throw new Error("Texto exibido sem chave de tradução: " + text);
    }
  }
  return text;
}

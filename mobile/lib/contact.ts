export const AGENCY_PHONE_TEL = "+18623501161";
export const AGENCY_PHONE_DISPLAY = "+1 (862) 350-1161";
export const AGENCY_EMAIL = "contact@michelstravel.agency";
export const AGENCY_WHATSAPP_NUMBER = "18623501161";

type ContactLanguage = "pt" | "en" | "es";

type WhatsAppMessageOptions = {
  language?: ContactLanguage;
  topic?: string;
  details?: Array<string | null | undefined | false>;
};

export function buildWhatsAppMessage({
  language = "pt",
  topic,
  details = [],
}: WhatsAppMessageOptions = {}) {
  const intro =
    language === "en"
      ? "Hi, I came from the Michels Travel Senior app and I want help with my trip."
      : language === "es"
        ? "Hola, vengo de la app Michels Travel Senior y quiero ayuda con mi viaje."
        : "Ola, cheguei pelo app Michels Travel Senior e quero ajuda com a minha viagem.";

  const topicLabel =
    language === "en"
      ? "Topic"
      : language === "es"
        ? "Tema"
        : "Assunto";

  const filteredDetails = details
    .map((item) => (item || "").trim())
    .filter(Boolean);

  return [
    intro,
    topic ? `${topicLabel}: ${topic}` : null,
    ...filteredDetails,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppHref(message?: string) {
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${AGENCY_WHATSAPP_NUMBER}${query}`;
}

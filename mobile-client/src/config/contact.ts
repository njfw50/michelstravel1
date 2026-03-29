import { AppLanguage } from "../types/app";

export const AGENCY_PHONE_DISPLAY = "+1 (862) 350-1161";
export const AGENCY_EMAIL = "contact@michelstravel.agency";
export const AGENCY_WHATSAPP_NUMBER = "18623501161";

export function buildWhatsAppHref(language: AppLanguage, topic: string, details: Array<string | null | undefined> = []) {
  const intro =
    language === "en"
      ? "Hi, I came from the Michels Travel app and I want help with my trip."
      : language === "es"
        ? "Hola, llegue por la app de Michels Travel y quiero ayuda con mi viaje."
        : "Ola, cheguei pelo app da Michels Travel e quero ajuda com a minha viagem.";

  const filteredDetails = details.map((item) => (item || "").trim()).filter(Boolean);
  const message = [intro, `Assunto: ${topic}`, ...filteredDetails].join("\n");

  return `https://wa.me/${AGENCY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

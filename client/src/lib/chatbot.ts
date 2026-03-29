export type ChatbotOpenOptions = {
  message?: string;
  autoSend?: boolean;
};

export const CHATBOT_PREFILL_BOOKING_EVENT = "michels:prefill-booking-form";

export type ChatbotBookingPrefillPassenger = {
  title?: "mr" | "mrs" | "ms" | "miss" | "dr";
  givenName: string;
  familyName: string;
  bornOn?: string;
  gender?: "m" | "f";
  email?: string;
  phoneNumber?: string;
  documentType?: "passport" | "national_id" | "drivers_license" | "travel_document" | "other";
  documentNumber?: string;
  documentExpiryDate?: string;
  documentIssuingCountry?: string;
  nationality?: string;
};

export type ChatbotBookingPrefillPayload = {
  contactEmail?: string;
  contactPhone?: string;
  passengers: ChatbotBookingPrefillPassenger[];
};

export function openChatbotAssistant(options: ChatbotOpenOptions = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ChatbotOpenOptions>("michels:open-chatbot", {
      detail: options,
    }),
  );
}

export function emitChatbotBookingPrefill(payload: ChatbotBookingPrefillPayload) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ChatbotBookingPrefillPayload>(CHATBOT_PREFILL_BOOKING_EVENT, {
      detail: payload,
    }),
  );
}

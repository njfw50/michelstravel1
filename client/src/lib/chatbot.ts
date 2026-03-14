export type ChatbotOpenOptions = {
  message?: string;
  autoSend?: boolean;
};

export function openChatbotAssistant(options: ChatbotOpenOptions = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ChatbotOpenOptions>("michels:open-chatbot", {
      detail: options,
    }),
  );
}

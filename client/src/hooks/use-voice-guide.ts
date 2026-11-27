import { useState, useCallback } from "react";
import { speakNaturally, stopNaturalSpeech, type VoiceLang } from "@/lib/senior-voice";

/* Guia de voz (Booking / EasyBooking) — usa o mesmo motor da Mia do
   Terminal Senior (Rodada 6): melhor voz do idioma, rate/pitch por
   idioma (Gemini) e frases com pausas. Antes: rate 0.90 / pitch 1.05
   fixos, sem escolha de voz, frase inteira de uma vez. */
export function useVoiceGuide() {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    stopNaturalSpeech();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options?: { lang?: string; onEnd?: () => void; onError?: () => void }) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      options?.onError?.();
      return;
    }

    // Nunca sobrepor vozes: cancela a sequência atual antes da nova.
    stop();

    const lang = (options?.lang || "pt-BR") as VoiceLang;
    setSpeaking(true);
    speakNaturally(text, lang, {
      onEnd: () => {
        setSpeaking(false);
        if (options?.onEnd) options.onEnd();
      },
    });
  }, [stop]);

  return { speak, stop, speaking, supported: typeof window !== "undefined" && Boolean(window.speechSynthesis) };
}

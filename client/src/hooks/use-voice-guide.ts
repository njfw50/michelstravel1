import { useRef, useState, useCallback } from "react";

export function useVoiceGuide() {
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, lang?: string) => {
    if (!synthRef.current) return;
    stop();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang || "pt-BR";
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synthRef.current.speak(utter);
  }, [stop]);

  return { speak, stop, speaking, supported: Boolean(synthRef.current) };
}

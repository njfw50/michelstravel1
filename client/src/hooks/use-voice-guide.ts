import { useRef, useState, useCallback } from "react";

export function useVoiceGuide() {
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const [speaking, setSpeaking] = useState(false);
  const queueRef = useRef<string[]>([]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      queueRef.current = [];
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options?: { lang?: string; onEnd?: () => void; onError?: () => void }) => {
    if (!synthRef.current) return;
    
    // Integrity Nuance: Never overlap voices, always cancel current sequence for new high-priority guidance
    stop();
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = options?.lang || "pt-BR";
    utter.rate = 0.90; // Slightly slower for elderly clarity
    utter.pitch = 1.05; // Slightly clearer/warmer pitch
    
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => {
      setSpeaking(false);
      if (options?.onEnd) options.onEnd();
    };
    utter.onerror = (e) => {
      console.warn("Speech Synthesis Error:", e);
      setSpeaking(false);
      if (options?.onError) options.onError();
    };
    
    synthRef.current.speak(utter);
  }, [stop]);

  return { speak, stop, speaking, supported: Boolean(synthRef.current) };
}

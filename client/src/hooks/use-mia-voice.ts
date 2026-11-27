import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = { isFinal: boolean; 0?: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function useMiaVoice(lang: string, active: boolean, onTranscript: (text: string) => void) {
  const recognition = useRef<Recognition | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(false);
  const browser = typeof window !== "undefined" ? window as SpeechWindow : null;
  const Constructor = browser?.SpeechRecognition || browser?.webkitSpeechRecognition;
  const canDictate = Boolean(Constructor && browser?.isSecureContext);
  const canSpeak = Boolean(browser?.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined");

  const stopListening = useCallback(() => {
    const current = recognition.current;
    recognition.current = null;
    if (current) {
      current.onresult = current.onerror = current.onend = null;
      try { current.abort(); } catch { /* already stopped */ }
    }
    setListening(false);
  }, []);
  const stopSpeaking = useCallback(() => {
    if (utterance.current) {
      utterance.current.onend = utterance.current.onerror = null;
      utterance.current = null;
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);
  useEffect(() => {
    if (!active) { stopListening(); stopSpeaking(); }
    return () => { stopListening(); stopSpeaking(); };
  }, [active, lang, stopListening, stopSpeaking]);

  const dictate = () => {
    if (recognition.current) { stopListening(); return; }
    if (!active || !Constructor || !canDictate) return;
    stopSpeaking();
    setError(false);
    const current = new Constructor();
    recognition.current = current;
    current.lang = lang;
    current.continuous = false;
    current.interimResults = false;
    current.onresult = event => {
      if (recognition.current !== current) return;
      const parts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && result[0]?.transcript) parts.push(result[0].transcript);
      }
      const text = parts.join(" ").trim();
      if (text) callback.current(text);
    };
    current.onerror = () => {
      if (recognition.current === current) { setError(true); stopListening(); }
    };
    current.onend = () => {
      if (recognition.current === current) { recognition.current = null; setListening(false); }
    };
    try { setListening(true); current.start(); }
    catch { setError(true); stopListening(); }
  };
  const speak = (text: string) => {
    if (!active || !canSpeak || !text.trim()) return;
    if (utterance.current) { stopSpeaking(); return; }
    stopListening();
    setError(false);
    const current = new SpeechSynthesisUtterance(text);
    current.lang = lang;
    const localVoice = window.speechSynthesis.getVoices().find(voice =>
      voice.localService && voice.lang.toLowerCase() === lang.toLowerCase());
    if (localVoice) current.voice = localVoice;
    utterance.current = current;
    current.onend = () => {
      if (utterance.current === current) { utterance.current = null; setSpeaking(false); }
    };
    current.onerror = () => {
      if (utterance.current === current) { utterance.current = null; setSpeaking(false); setError(true); }
    };
    try { setSpeaking(true); window.speechSynthesis.speak(current); }
    catch { setError(true); stopSpeaking(); }
  };
  return { canDictate, canSpeak, listening, speaking, error, dictate, speak, stopListening, stopSpeaking };
}

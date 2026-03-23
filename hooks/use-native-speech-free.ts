import { useCallback, useEffect, useRef, useState } from "react";
import Voice from "react-native-voice";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

type Lang = "pt" | "es" | "en";

export function useNativeSpeechFree() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const langRef = useRef<Lang>("pt");

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      const value = e.value?.[0] ?? "";
      setTranscript(value);
      setListening(false);
    };
    Voice.onSpeechError = (e) => {
      setError(e.error?.message ?? "Erro no reconhecimento");
      setListening(false);
    };
    return () => {
      Voice.destroy().catch(() => {});
    };
  }, []);

  const start = useCallback(
    async (lang: Lang) => {
      if (Platform.OS === "web") return;
      langRef.current = lang;
      setTranscript("");
      setError(null);
      setListening(true);
      await Voice.start(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US");
    },
    [],
  );

  const stop = useCallback(async () => {
    if (Platform.OS === "web") return null;
    await Voice.stop();
    setListening(false);
    return transcript;
  }, [transcript]);

  const speak = useCallback((text: string, lang: Lang) => {
    Speech.speak(text, {
      language: lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US",
      rate: lang === "pt" ? 0.9 : 1,
    });
  }, []);

  return {
    listening,
    transcript,
    error,
    start,
    stop,
    speak,
    available: Platform.OS !== "web",
  };
}

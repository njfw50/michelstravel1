import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type RecorderState = "idle" | "recording" | "stopped" | "error" | "unsupported";

export function useWebVoiceRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecorderState>(() =>
    Platform.OS === "web" ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (Platform.OS !== "web") {
      setState("unsupported");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("stopped");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar gravação");
      setState("error");
    }
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      const done = new Promise<Blob>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setState("stopped");
          resolve(blob);
        };
      });
      mediaRecorderRef.current.stop();
      return done;
    }
    return null;
  }, []);

  return { state, error, start, stop };
}

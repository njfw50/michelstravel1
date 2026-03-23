import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-audio";
import * as FileSystem from "expo-file-system";

type RecorderState = "idle" | "recording" | "stopped" | "error" | "unsupported" | "no-permission";

export function useNativeVoiceRecorder() {
  const [state, setState] = useState<RecorderState>(
    Platform.OS === "web" ? "unsupported" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (Platform.OS === "web") {
      setState("unsupported");
      return;
    }
    setError(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setState("no-permission");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gravar");
      setState("error");
    }
  }, []);

  const stop = useCallback(async (): Promise<{ uri: string; dataUrl: string } | null> => {
    const rec = recordingRef.current;
    if (!rec || state !== "recording") return null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) throw new Error("Sem URI após gravação");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:audio/m4a;base64,${base64}`;
      setState("stopped");
      return { uri, dataUrl };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao parar gravação");
      setState("error");
      return null;
    }
  }, [state]);

  return { state, error, start, stop };
}

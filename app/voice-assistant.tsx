import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform, ScrollView, Switch } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useWebVoiceRecorder } from "@/hooks/use-web-voice-recorder";
import { useNativeVoiceRecorder } from "@/hooks/use-native-voice-recorder";
import { useNativeSpeechFree } from "@/hooks/use-native-speech-free";
import { Audio } from "expo-audio";
import { cacheDirectory, documentDirectory, writeAsStringAsync, EncodingType } from "expo-file-system";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceAssistantScreen() {
  const colors = useColors();
  const webRecorder = useWebVoiceRecorder();
  const nativeRecorder = useNativeVoiceRecorder();
  const isWeb = Platform.OS === "web";
  const recorder = isWeb ? webRecorder : nativeRecorder;
  const nativeSpeech = useNativeSpeechFree();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [status, setStatus] = useState<string>("Pronto para gravar");
  const [language, setLanguage] = useState<"pt" | "es" | "en">("pt");
  const [useBrowserFree, setUseBrowserFree] = useState<boolean>(Platform.OS === "web");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const transcribe = trpc.voice.transcribe.useMutation();
  const speak = trpc.voice.speak.useMutation();

  const isRecording = recorder.state === "recording";
  const busy = transcribe.isPending || speak.isPending || isRecording;

  useEffect(() => {
    setStatus(
      recorder.state === "unsupported"
        ? "Gravação web apenas. Em mobile, usar futuro modo nativo."
        : recorder.state === "recording"
          ? "Gravando..."
          : "Pronto para gravar",
    );
  }, [recorder.state]);

  const handleStart = async () => {
    if (useBrowserFree && isWeb && "webkitSpeechRecognition" in window) {
      const Rec: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec: SpeechRecognition = new Rec();
      rec.lang = language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const txt = e.results[0][0].transcript;
        setTranscript(txt);
        playBrowserTTS(`Entendi o que você disse: ${txt}`, language);
        setStatus(`Transcrito (${rec.lang})`);
      };
      rec.onerror = (e: any) => setStatus(`Erro: ${e.error || "reconhecimento"}`);
      recognitionRef.current = rec;
      rec.start();
      setStatus("Gravando (Web Speech API)...");
      return;
    }
    if (!isWeb && useBrowserFree && nativeSpeech.available) {
      setStatus("Gravando (voz nativa do SO)...");
      nativeSpeech.start(language);
      return;
    }
    await recorder.start();
  };

  const playBrowserTTS = (text: string, lang: "pt" | "es" | "en") => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US";
    utter.rate = lang === "pt" ? 0.9 : 1;
    speechSynthesis.speak(utter);
  };

  const playSpeech = async (base64: string) => {
    if (useBrowserFree && isWeb && "speechSynthesis" in window) {
      playBrowserTTS("Resposta gerada.", language);
      return;
    }
    if (isWeb) {
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      audio.play().catch(() => {});
      return;
    }
    // Native: salvar em arquivo temporário e reproduzir
    const dir = cacheDirectory || documentDirectory || "";
    const fileUri = `${dir}tts-response.wav`;
    await writeAsStringAsync(fileUri, base64, {
      encoding: EncodingType.Base64,
    });
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: fileUri });
    await sound.playAsync();
  };

  const handleStop = async () => {
    if (useBrowserFree && isWeb && recognitionRef.current) {
      recognitionRef.current.stop();
      setStatus("Processando reconhecimento local...");
      return;
    }
    if (!isWeb && useBrowserFree && nativeSpeech.available) {
      const txt = await nativeSpeech.stop();
      if (txt) {
        setTranscript(txt);
        nativeSpeech.speak(`Entendi o que você disse: ${txt}`, language);
        setStatus("Reproduzindo resposta (nativo)");
      }
      return;
    }

    const recordingResult = await recorder.stop();
    if (!recordingResult) return;

    let dataUrl: string;
    if (isWeb) {
      const blob = recordingResult as unknown as Blob;
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      dataUrl = await blobToDataUrl(blob);
    } else {
      const { uri, dataUrl: nativeDataUrl } = recordingResult as { uri: string; dataUrl: string };
      setAudioUrl(uri);
      dataUrl = nativeDataUrl;
    }

    setStatus("Transcrevendo...");

    const res = await transcribe.mutateAsync({
      audioUrl: dataUrl,
      language,
    });
    setTranscript(res.text);
    setStatus(`Transcrito (${res.language})`);

    const phrase = `Entendi o que você disse: ${res.text}`;
    const speech = await speak.mutateAsync({
      text: phrase,
      language,
      format: "wav",
      speed: language === "pt" ? 0.9 : 1,
    });
    await playSpeech(speech.audioBase64);
    setStatus("Reproduzindo resposta");
  };

  const LangButton = ({ code, label }: { code: "pt" | "es" | "en"; label: string }) => (
    <Pressable
      onPress={() => setLanguage(code)}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: language === code ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: language === code ? colors.onPrimary : colors.foreground,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Assistente de Voz</Text>
          <Text className="text-base text-muted-foreground mt-1">
            Toque e segure para gravar. Eu transcrevo e respondo em áudio no idioma escolhido.
          </Text>
          {recorder.state === "no-permission" && (
            <Text className="text-sm text-amber-600 mt-2">
              Permita o microfone para gravar.
            </Text>
          )}
        </View>

        <View className="flex-row items-center mb-3">
          <Text className="text-base font-semibold text-foreground mr-3">Idioma</Text>
          <LangButton code="pt" label="Português" />
          <LangButton code="es" label="Español" />
          <LangButton code="en" label="English" />
        </View>

        {isWeb && (
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="text-base text-foreground">Usar modo grátis (Web Speech)</Text>
            <Switch
              value={useBrowserFree}
              onValueChange={(v) => setUseBrowserFree(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        )}
        {!isWeb && (
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="text-base text-foreground">Usar modo grátis (Voz nativa)</Text>
            <Switch
              value={useBrowserFree}
              onValueChange={(v) => setUseBrowserFree(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        )}

        <Pressable
          onPressIn={busy ? undefined : handleStart}
          onPressOut={busy ? undefined : handleStop}
          style={{
            height: 160,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isRecording ? colors.primary : colors.surface,
            borderWidth: 2,
            borderColor: isRecording ? colors.primary : colors.border,
          }}
        >
          {busy ? (
            <ActivityIndicator size="large" color={colors.onPrimary} />
          ) : (
            <>
              <MaterialIcons
                name={isRecording ? "mic" : "mic-none"}
                size={48}
                color={isRecording ? colors.onPrimary : colors.foreground}
              />
              <Text
                className="mt-3 text-lg font-semibold"
                style={{ color: isRecording ? colors.onPrimary : colors.foreground }}
              >
                {isRecording ? "Gravando..." : "Pressione e fale"}
              </Text>
            </>
          )}
        </Pressable>

        <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
          <Text className="text-sm text-muted-foreground mb-2">Status</Text>
          <Text className="text-base text-foreground font-semibold">{status}</Text>
        </View>

        {transcript ? (
          <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm text-muted-foreground mb-2">Transcrição</Text>
            <Text className="text-base text-foreground">{transcript}</Text>
          </View>
        ) : null}

        {audioUrl ? (
          <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm text-muted-foreground mb-2">Última gravação (preview)</Text>
            <AudioPreview url={audioUrl} />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function AudioPreview({ url }: { url: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <MaterialIcons name="graphic-eq" size={20} color="#888" />
      <Text selectable style={{ color: "#888" }}>
        {url}
      </Text>
    </View>
  );
}

import { ENV } from "./env";

type SpeechModel =
  | "gpt-4o-mini-tts"
  | "gpt-4o-mini-tts-extended"
  | "gpt-4o-audio-preview"
  | "gpt-4o-realtime-preview-2024-12-17";

type TTSFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

export type SpeakInput = {
  text: string;
  language?: string; // ISO 639-1 code (e.g., pt, es, en)
  voice?: string; // OpenAI voice id, defaults to alloy
  format?: TTSFormat;
  model?: SpeechModel;
  speed?: number; // 0.25 - 4
};

export type SpeakResult = {
  audioBase64: string;
  format: TTSFormat;
};

export type TranscribeInput = {
  audioUrl: string;
  language?: string;
  prompt?: string;
  model?: string;
};

export type TranscribeResult = {
  text: string;
  language: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
};

function requireApiKey(): string {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return ENV.openaiApiKey;
}

export async function speakText({
  text,
  language,
  voice = "alloy",
  format = "wav",
  model = "gpt-4o-mini-tts",
  speed = 1,
}: SpeakInput): Promise<SpeakResult> {
  const apiKey = requireApiKey();

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: format,
      speed,
      language,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`TTS failed: ${res.status} ${detail}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    audioBase64: buffer.toString("base64"),
    format,
  };
}

export async function transcribeWithOpenAI({
  audioUrl,
  language,
  prompt,
  model = "whisper-1",
}: TranscribeInput): Promise<TranscribeResult> {
  const apiKey = requireApiKey();

  // Download audio
  const audioResp = await fetch(audioUrl);
  if (!audioResp.ok) {
    throw new Error(`Failed to fetch audio: ${audioResp.status} ${audioResp.statusText}`);
  }
  const mimeType = audioResp.headers.get("content-type") || "audio/mpeg";
  const audioBuffer = Buffer.from(await audioResp.arrayBuffer());

  // Build multipart request
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([audioBuffer], { type: mimeType }),
    `input.${mimeType.split("/")[1] || "mp3"}`,
  );
  formData.append("model", model);
  formData.append("response_format", "verbose_json");
  if (language) formData.append("language", language);
  if (prompt) formData.append("prompt", prompt);

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Transcription failed: ${resp.status} ${detail}`);
  }

  const json = (await resp.json()) as any;
  return {
    text: json.text,
    language: json.language,
    segments: json.segments?.map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}

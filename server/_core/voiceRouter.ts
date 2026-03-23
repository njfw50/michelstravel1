import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { speakText, transcribeWithOpenAI } from "./openaiVoice";
import { ENV } from "./env";

const languageEnum = z
  .string()
  .min(2)
  .max(8)
  .optional()
  .describe("ISO 639-1 language code, e.g., pt, es, en");

export const voiceRouter = router({
  transcribe: publicProcedure
    .input(
      z.object({
        audioUrl: z.string().url(),
        language: languageEnum,
        prompt: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await transcribeWithOpenAI({
        audioUrl: input.audioUrl,
        language: input.language,
        prompt: input.prompt,
        model: ENV.openaiSttModel,
      });

      return result;
    }),

  speak: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(4000),
        language: languageEnum,
        voice: z.string().max(50).optional(),
        format: z.enum(["mp3", "opus", "aac", "flac", "wav", "pcm"]).optional(),
        speed: z.number().min(0.25).max(4).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await speakText({
        text: input.text,
        language: input.language,
        voice: input.voice,
        format: input.format,
        speed: input.speed,
        model: ENV.openaiTtsModel as any,
      });

      return result;
    }),
});

export type VoiceRouter = typeof voiceRouter;

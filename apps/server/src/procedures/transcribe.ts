import { z } from "zod";
import { defaultTranscribeEngine } from "@/config";
import {
  getWhisperModels,
  transcribe as whisperTranscribe,
} from "@/services/ai-providers";
import { publicProcedure } from "./base";

export const transcribeProcedures = {
  models: publicProcedure
    .input(
      z
        .object({
          engine: z.enum(["whisperx", "whisper"]).optional(),
        })
        .optional()
    )
    .handler(async ({ input }) => {
      const engine = input?.engine ?? defaultTranscribeEngine;
      // Unused engine variable for future differentiation; currently both engines share model list
      const _ = engine;
      return await getWhisperModels();
    }),

  transcribe: publicProcedure
    .input(
      z.object({
        file: z
          .instanceof(Blob)
          .refine((blob) => blob.size > 0, "File cannot be empty")
          .and(z.object({ name: z.string() })),
        language: z.enum(["fa", "en"]).optional(),
        model: z.string().optional(),
        engine: z.enum(["whisperx", "whisper"]).optional(),
      })
    )
    .output(z.string())
    .handler(({ input }) => {
      const engine = input.engine ?? defaultTranscribeEngine;
      const language = input.language ?? "fa";
      const model = input.model ?? "tiny";

      // Convert Blob & { name } to File for whisper service
      const file = new File([input.file], input.file.name, {
        type: input.file.type || "audio/webm",
      });

      return whisperTranscribe({
        file,
        language,
        model,
        engine,
      });
    }),
};

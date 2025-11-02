import { z } from "zod";
import { defaultTranscribeEngine, defaultWhisperModel } from "@/config";
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
      if (engine) {
        // Both engines share the same model id set for now.
      }
      return await getWhisperModels();
    }),

  transcribe: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        language: z.string().length(2).optional(),
        model: z.string().optional(),
        engine: z.enum(["whisperx", "whisper"]).optional(),
      })
    )
    .output(z.string())
    .handler(({ input }) => {
      const engine = input.engine ?? defaultTranscribeEngine;
      const language = input.language ?? "fa";
      const model =
        input.model ?? (engine === "whisper" ? "tiny" : defaultWhisperModel);
      return whisperTranscribe({
        file: input.file,
        language,
        model,
        engine,
      });
    }),
};

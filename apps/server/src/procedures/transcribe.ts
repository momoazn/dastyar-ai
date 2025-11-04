import { z } from "zod";
import {
  getWhisperModels,
  transcribe as whisperTranscribe,
} from "@/services/ai-providers";
import { publicProcedure } from "./base";

export const transcribeProcedures = {
  models: publicProcedure
    .input(z.object({}).optional())
    .handler(async () => await getWhisperModels()),

  transcribe: publicProcedure
    .input(
      z.object({
        file: z
          .instanceof(Blob)
          .refine((blob) => blob.size > 0, "File cannot be empty")
          .and(z.object({ name: z.string() })),
        language: z.enum(["fa", "en"]).optional(),
        model: z.string().optional(),
        initialPrompt: z.string().optional(),
      })
    )
    .output(z.string())
    .handler(async ({ input }) => {
      const language = input.language ?? "fa";
      const model = input.model ?? "large-v2";

      // Convert Blob & { name } to File for whisper service
      const file = new File([input.file], input.file.name, {
        type: input.file.type || "audio/webm",
      });

      return await whisperTranscribe({
        file,
        language,
        model,
        initialPrompt: input.initialPrompt,
      });
    }),
};

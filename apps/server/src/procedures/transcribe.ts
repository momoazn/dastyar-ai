import { z } from "zod";
import { defaultWhisperModel } from "@/config";
import {
  getWhisperModels,
  transcribe as whisperTranscribe,
} from "@/services/whisper";
import { publicProcedure } from "./base";

export const transcribeProcedures = {
  models: publicProcedure.handler(async () => await getWhisperModels()),

  transcribe: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        language: z.string().length(2).optional(),
        model: z.string().optional(),
      })
    )
    .output(z.string())
    .handler(async ({ input }) =>
      whisperTranscribe({
        file: input.file,
        language: input.language ?? "fa",
        model: input.model ?? defaultWhisperModel,
      })
    ),
};

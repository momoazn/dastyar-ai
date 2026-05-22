import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  getWhisperModels,
  transcribe as whisperTranscribe,
} from "@/services/ai-providers";
import { protectedProcedure } from "./base";

export const transcribeProcedures = {
  models: protectedProcedure
    .input(z.object({}).optional())
    .handler(async () => await getWhisperModels()),

  transcribe: protectedProcedure
    .input(
      z.object({
        file: z.preprocess(
          (val) => {
            // If it's already a File, return it
            if (val instanceof File) {
              return val;
            }
            // If it's a Blob-like object, try to convert it to File
            if (val && typeof val === "object" && "size" in val) {
              const blob = val as Blob;
              return new File(
                [blob],
                (val as { name?: string }).name || "audio.webm",
                {
                  type: blob.type || "audio/webm",
                }
              );
            }
            return val;
          },
          z
            .instanceof(File)
            .refine((file) => file.size > 0, "File cannot be empty")
        ),
        language: z.enum(["fa", "en"]).optional(),
        model: z.string().optional(),
        initialPrompt: z.string().optional(),
      })
    )
    .output(z.string())
    .handler(async ({ input, context }) => {
      try {
        const language = input.language ?? "fa";
        const model = input.model ?? "ggml-base.bin";

        logger.info("start of transcribe procedure, args", {
          fileType: typeof input.file,
          fileConstructor: input.file?.constructor?.name,
          fileIsFile: input.file instanceof File,
          fileIsBlob: input.file instanceof Blob,
          fileName: input.file?.name,
          fileSize: input.file?.size,
          contentType: context.req?.header("content-type") ?? null,
          language,
          model,
          initialPrompt: input.initialPrompt,
        });

        if (!(input.file instanceof File)) {
          const fileAny = input.file as unknown;
          logger.error("File validation failed", undefined, {
            receivedType: typeof fileAny,
            constructor: (fileAny as { constructor?: { name?: string } })
              ?.constructor?.name,
            isFile: fileAny instanceof File,
            isBlob: fileAny instanceof Blob,
          });
          throw new Error(
            `Expected File instance, received ${typeof fileAny} (${
              (fileAny as { constructor?: { name?: string } })?.constructor
                ?.name ?? "unknown"
            })`
          );
        }

        return await whisperTranscribe({
          file: input.file,
          language,
          model,
          initialPrompt: input.initialPrompt,
        });
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error(String(error ?? "Error"));
        logger.error("Transcribe procedure error", err, {
          inputType: typeof input,
          fileType: typeof input?.file,
          fileConstructor: (input?.file as { constructor?: { name?: string } })
            ?.constructor?.name,
        });
        throw new ORPCError("TRANSCRIBE_FAILED", {
          status: 500,
          message: err.message,
        });
      }
    }),
};

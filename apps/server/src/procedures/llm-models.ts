import z from "zod";
import { logger } from "@/lib/logger";
import { getModels, syncModels } from "@/repositories/llm-models";
import { listAllModels } from "@/services/ai-providers";
import { publicProcedure } from "./base";

export const llmModelProcedures = {
  list: publicProcedure
    .input(
      z
        .object({
          isEnabled: z.boolean().optional().default(true),
          sync: z.boolean().optional().default(true),
        })
        .optional()
    )
    .handler(async ({ input }) => {
      try {
        const { isEnabled = true, sync = true } = input ?? {
          isEnabled: true,
          sync: true,
        };

        if (sync) {
          const availableModels = await listAllModels();
          const allModels = await syncModels(availableModels, { isEnabled });
          const nonEmbeds = allModels.filter(
            (model) => !model.identifier.includes("embed")
          );
          return nonEmbeds;
        }

        // Return models without syncing
        const models = await getModels({ isEnabled });
        const nonEmbeds = models.filter(
          (model) => !model.identifier.includes("embed")
        );
        return nonEmbeds;
      } catch (error) {
        logger.error("Error listing models", error);
        throw error;
      }
    }),
};

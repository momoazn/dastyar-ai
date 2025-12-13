import z from "zod";
import { logger } from "@/lib/logger";
import {
  getModelById,
  getModels,
  syncModels,
  updateModel,
} from "@/repositories/llm-models";
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

  enable: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      try {
        const model = await getModelById(input.id);
        if (!model) {
          throw new Error(`Model with id ${input.id} not found`);
        }

        await updateModel(input.id, { isEnabled: true });
        return getModels({ isEnabled: true });
      } catch (error) {
        logger.error("Error enabling model", error, { modelId: input.id });
        throw error;
      }
    }),

  disable: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      try {
        const model = await getModelById(input.id);
        if (!model) {
          throw new Error(`Model with id ${input.id} not found`);
        }

        await updateModel(input.id, { isEnabled: false });
        return getModels({ isEnabled: true });
      } catch (error) {
        logger.error("Error disabling model", error, { modelId: input.id });
        throw error;
      }
    }),
};

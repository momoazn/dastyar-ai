import z from 'zod';
import {
  getModelById,
  getModels,
  syncModels,
  updateModel,
} from '@/repositories/llm-models';
import { listAllModels } from '@/services';
import { publicProcedure } from './base';

export const llmModelProcedures = {
  list: publicProcedure
    .input(
      z
        .object({
          isEnabled: z.boolean().optional().default(true),
        })
        .optional()
    )
    .handler(async ({ input }) => {
      try {
        const models = await listAllModels();
        await syncModels(models);
        const syncedModels = await getModels(input ?? {});
        return syncedModels;
      } catch (error) {
        console.error('Error listing models:', error);
        throw error;
      }
    }),
  sync: publicProcedure.handler(async () => {
    const models = await listAllModels();
    await syncModels(models);
    const syncedModels = await getModels({ isEnabled: true });
    return syncedModels;
  }),
  enable: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await getModelById(input.id);
      await updateModel(input.id, { isEnabled: true });
      const enabledModels = await getModels({ isEnabled: true });
      return enabledModels;
    }),
};

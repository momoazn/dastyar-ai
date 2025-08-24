import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { ModelProviderEnum } from '../../config';
import { models } from '../../database/schema';
import { syncModels } from '../../services/model-sync';
import { publicProcedure } from '../index';

export const modelProcedures = {
  list: publicProcedure
    .input(
      z.object({
        isEnabled: z.boolean().optional(),
        providers: z.array(z.enum(Object.values(ModelProviderEnum))).optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const rows = await context.db
        .select({
          id: models.id,
          name: models.name,
          provider: models.provider,
          isEnabled: models.isEnabled,
        })
        .from(models)
        .where(
          and(
            input.isEnabled ? eq(models.isEnabled, true) : undefined,
            input.providers
              ? inArray(models.provider, input.providers)
              : inArray(models.provider, Object.values(ModelProviderEnum))
          )
        )
        .orderBy(asc(models.name));

      const providerPriority: Record<string, number> = {
        [ModelProviderEnum.OLLAMA]: 0,
        [ModelProviderEnum.LMSTUDIO]: 1,
      };
      rows.sort((a, b) => {
        const pa = providerPriority[a.provider] ?? 2;
        const pb = providerPriority[b.provider] ?? 2;
        if (pa !== pb) {
          return pa - pb;
        }
        return a.name.localeCompare(b.name);
      });

      return rows;
    }),
  sync: publicProcedure.handler(async () => {
    await syncModels();
    return { ok: true } as const;
  }),
};

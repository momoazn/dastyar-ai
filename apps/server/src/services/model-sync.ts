import { and, eq, inArray, not } from 'drizzle-orm';
import { insertModelSchema, models } from '../database/schema';
import { db } from '../database';
import { ModelProviderEnum } from './ai-providers/constants';
import { listAllModels } from './ai-providers';
import { generateId } from '../utils/id-generator';

export async function syncModels() {
  console.log('--- Syncing models...');

  const allModels = await listAllModels();

  console.log('--- Found', allModels.length, 'models');

  // Prepare rows for upsert (no preloading from DB)
  const rowsToUpsert = allModels.map((m: { id: string; provider: string }) => ({
    id: generateId(),
    name: m.id,
    provider: m.provider,
    isEnabled: true,
  }));

  if (rowsToUpsert.length > 0) {
    // Single bulk insert; on conflicts (provider, name) do nothing (no updates)
    await db
      .insert(models)
      .values(rowsToUpsert)
      .onConflictDoNothing({ target: [models.provider, models.name] });
  }

  // Enable models that are present in the latest provider lists
  const modelsByProvider = new Map<string, string[]>();
  for (const m of allModels) {
    const list = modelsByProvider.get(m.provider) ?? [];
    list.push(m.id);
    modelsByProvider.set(m.provider, list);
  }

  const enableUpdates: Promise<unknown>[] = [];
  for (const [provider, names] of modelsByProvider.entries()) {
    if (names.length > 0) {
      enableUpdates.push(
        db
          .update(models)
          .set({ isEnabled: true })
          .where(
            and(eq(models.provider, provider), inArray(models.name, names))
          )
      );
    }
  }

  // Disable models that are NOT present in the latest lists (per local provider)
  // If a local provider had no models returned, disable all of that provider.
  const localProviders = [ModelProviderEnum.OLLAMA, ModelProviderEnum.LMSTUDIO];
  const disableUpdates: Promise<unknown>[] = [];
  for (const provider of localProviders) {
    const names = modelsByProvider.get(provider) ?? [];
    if (names.length === 0) {
      disableUpdates.push(
        db
          .update(models)
          .set({ isEnabled: false })
          .where(eq(models.provider, provider))
      );
    } else {
      disableUpdates.push(
        db
          .update(models)
          .set({ isEnabled: false })
          .where(
            and(eq(models.provider, provider), not(inArray(models.name, names)))
          )
      );
    }
  }

  await Promise.all([...enableUpdates, ...disableUpdates]);

  console.log('--- Models synced');
}
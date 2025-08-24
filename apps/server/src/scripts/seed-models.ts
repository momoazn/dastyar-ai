import 'dotenv/config';

import { getAiProviderModels, ModelProviderEnum } from '../config';
import { db } from '../database';
import { runMigrations } from '../database/migrate';
import { models as modelsTable } from '../database/schema';
import { generateId } from '../utils/id-generator';

const MODELS_BY_PROVIDER = {
  [ModelProviderEnum.GEMINI]: getAiProviderModels(ModelProviderEnum.GEMINI),
  [ModelProviderEnum.GROQ]: getAiProviderModels(ModelProviderEnum.GROQ),
  [ModelProviderEnum.OPENROUTER]: getAiProviderModels(
    ModelProviderEnum.OPENROUTER
  ),
};

async function seedSelectedProviders() {
  const promises: Promise<unknown>[] = [];
  for (const [provider, models] of Object.entries(MODELS_BY_PROVIDER)) {
    for (const model of models) {
      promises.push(
        db.insert(modelsTable).values({
          id: generateId(),
          name: model,
          provider,
          isEnabled: true,
        })
      );
    }
  }

  await Promise.all(promises);
}

async function main() {
  await runMigrations();
  await seedSelectedProviders();
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

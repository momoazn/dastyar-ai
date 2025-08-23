import 'dotenv/config';

import { db } from '../database';
import { runMigrations } from '../database/migrate';
import { models as modelsTable } from '../database/schema';
import { ModelProviderEnum } from '../services/ai-providers/constants';
import { GEMINI_MODELS } from '../services/ai-providers/gemini';
import { GROQ_MODELS } from '../services/ai-providers/groq';
import { OPENROUTER_MODELS } from '../services/ai-providers/openrouter';
import { generateId } from '../utils/id-generator';

const MODELS_BY_PROVIDER = {
  [ModelProviderEnum.GEMINI]: GEMINI_MODELS,
  [ModelProviderEnum.GROQ]: GROQ_MODELS,
  [ModelProviderEnum.OPENROUTER]: OPENROUTER_MODELS,
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
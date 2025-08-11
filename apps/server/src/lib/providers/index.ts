import { type Model, ModelProviderEnum } from '@/db/schema';
import { geminiFactories, geminiListFns, type geminiProvider } from './gemini';
import { groqFactories, groqListFns, type groqProvider } from './groq';
import {
  type lmstudioProvider,
  localFactories,
  localListFns,
  ollamaProvider,
} from './local';
import {
  openrouterFactories,
  openrouterListFns,
  type openrouterProvider,
} from './openrouter';
import type { ProviderFactoriesRegistry, ProviderListRegistry } from './types';

// Merge registries
export const providerFactories: ProviderFactoriesRegistry = {
  ...localFactories,
  ...openrouterFactories,
  ...groqFactories,
  ...geminiFactories,
};

export const providerListFns: ProviderListRegistry = {
  ...localListFns,
  ...openrouterListFns,
  ...groqListFns,
  ...geminiListFns,
};

export type AnyProviderModel =
  | ReturnType<typeof ollamaProvider>
  | ReturnType<typeof lmstudioProvider>
  | ReturnType<typeof openrouterProvider>
  | ReturnType<typeof groqProvider>
  | ReturnType<typeof geminiProvider>;

export const listAllModels = async () => {
  const providers = Object.values(
    ModelProviderEnum
  ) as (typeof ModelProviderEnum)[keyof typeof ModelProviderEnum][];
  const results = await Promise.all(
    providers.map(async (provider) => {
      const listFn = providerListFns[provider];
      if (!listFn) {
        return [] as { id: string; provider: string }[];
      }
      const models = await listFn();
      return models.map((m) => ({ id: m.id, provider }));
    })
  );
  return results.flat();
};

export const getProviderForModel = (model: Model): AnyProviderModel => {
  const factory =
    providerFactories[model.provider as keyof typeof providerFactories];
  if (factory) {
    return factory(model.name) as AnyProviderModel;
  }
  return ollamaProvider(model.name);
};

export type { MinimalModel } from './types';

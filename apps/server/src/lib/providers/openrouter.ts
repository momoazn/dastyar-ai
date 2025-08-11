import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { ModelProviderEnum } from '@/db/schema';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

const OPENROUTER_BASE_URL = 'https://api.openrouter.ai/v1' as const;
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
const ENABLE_OPENROUTER =
  (process.env.ENABLE_OPENROUTER ?? '').toLowerCase() !== 'false';

let cachedClient: OpenAI | null = null;
const getClient = (): OpenAI | null => {
  if (!OPENROUTER_API_KEY) {
    return null;
  }
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
  });
  return cachedClient;
};

export const openrouterProvider = createOpenAICompatible({
  baseURL: OPENROUTER_BASE_URL,
  name: 'openrouter',
  apiKey: OPENROUTER_API_KEY,
});

export const listOpenrouterModels = async (): Promise<MinimalModel[]> => {
  if (!(ENABLE_OPENROUTER && OPENROUTER_API_KEY)) {
    return [];
  }
  try {
    const client = getClient();
    if (!client) {
      return [];
    }
    const models = await client.models.list();
    return models.data.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
};

export const openrouterFactories: ProviderFactoriesRegistry = {
  [ModelProviderEnum.OPENROUTER]: openrouterProvider,
};

export const openrouterListFns: ProviderListRegistry = {
  [ModelProviderEnum.OPENROUTER]: listOpenrouterModels,
};

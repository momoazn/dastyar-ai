import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import OpenAI from 'openai';
import {
  getAiProviderApiKey,
  getAiProviderBaseUrl,
  isAiProviderEnabled,
  type MinimalModel,
  ModelProviderEnum,
  type ProviderFactoriesRegistry,
  type ProviderListRegistry,
} from '../../config';

const OPENROUTER_API_KEY =
  getAiProviderApiKey(ModelProviderEnum.OPENROUTER) || '';
const OPENROUTER_BASE_URL =
  getAiProviderBaseUrl(ModelProviderEnum.OPENROUTER) ||
  'https://api.openrouter.ai/v1';
const ENABLE_OPENROUTER = isAiProviderEnabled(ModelProviderEnum.OPENROUTER);

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

export const openrouterProvider = createOpenRouter({
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

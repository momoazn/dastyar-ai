import { createGoogleGenerativeAI } from '@ai-sdk/google';
import OpenAI from 'openai';
import { ModelProviderEnum } from '@/db/schema';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || '';
const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/' as const;
const ENABLE_GEMINI =
  (process.env.ENABLE_GEMINI ?? '').toLowerCase() !== 'false';

const geminiClient = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: GEMINI_BASE_URL,
});

export const geminiProvider = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

export const listGeminiModels = async (): Promise<MinimalModel[]> => {
  if (!(ENABLE_GEMINI && GEMINI_API_KEY)) {
    return [];
  }
  try {
    const res = await geminiClient.models.list();
    return res.data.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
};

export const geminiFactories: ProviderFactoriesRegistry = {
  [ModelProviderEnum.GEMINI]: geminiProvider,
};

export const geminiListFns: ProviderListRegistry = {
  [ModelProviderEnum.GEMINI]: listGeminiModels,
};

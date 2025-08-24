import { createGoogleGenerativeAI } from '@ai-sdk/google';
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

const GEMINI_API_KEY = getAiProviderApiKey(ModelProviderEnum.GEMINI) || '';
const GEMINI_BASE_URL =
  getAiProviderBaseUrl(ModelProviderEnum.GEMINI) ||
  'https://generativelanguage.googleapis.com/v1beta/openai/';
const ENABLE_GEMINI = isAiProviderEnabled(ModelProviderEnum.GEMINI);

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

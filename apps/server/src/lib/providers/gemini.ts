import { createGoogleGenerativeAI } from '@ai-sdk/google';
import OpenAI from 'openai';
import { ModelProviderEnum } from './constants';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

export const GEMINI_MODELS = [
  // 'gemini-1.5-flash',
  // 'gemini-1.5-flash-latest',
  // 'gemini-1.5-flash-001',
  // 'gemini-1.5-flash-002',
  // 'gemini-1.5-flash-8b',
  // 'gemini-1.5-flash-8b-latest',
  // 'gemini-1.5-flash-8b-001',
  // 'gemini-1.5-pro',
  // 'gemini-1.5-pro-latest',
  // 'gemini-1.5-pro-001',
  // 'gemini-1.5-pro-002',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  // 'gemini-2.0-flash-live-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-pro-exp-02-05',
  'gemini-2.0-flash-thinking-exp-01-21',
  'gemini-2.0-flash-exp',
  // 'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro-exp-03-25',
  'gemini-2.5-flash-preview-04-17',
  // 'gemini-exp-1206',
  'gemma-3-12b-it',
  'gemma-3-27b-it',
];

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

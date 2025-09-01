import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Server configuration
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  DATABASE_FILE: z.string().default('./data.db'),

  // Whisper configuration
  WHISPER_MODELS_DIR: z.string().default('./whisper-models'),
  WHISPER_CACHE_DIR: z.string().default('./.whisper-cache'),
  WHISPER_WASM_DIR: z
    .string()
    .default(
      './node_modules/.bun/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist'
    ),
  WHISPER_ALLOW_REMOTE_MODELS: z.coerce.boolean().default(false),
  WHISPER_ALLOWED_MODELS: z.string().default('Xenova/whisper-tiny'),

  // AI Providers
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434/v1'),
  OLLAMA_API_KEY: z.string().default('ollama'),
  OLLAMA_ENABLED: z.coerce.boolean().default(true),

  LMSTUDIO_BASE_URL: z.string().default('http://localhost:1234/v1'),
  LMSTUDIO_API_KEY: z.string().default('lmstudio'),
  LMSTUDIO_ENABLED: z.coerce.boolean().default(false),

  OPENAI_API_KEY: z.string().default(''),
  OPENAI_BASE_URL: z.string().default(''),
  OPENAI_ENABLED: z.coerce.boolean().default(false),

  GROQ_API_KEY: z.string().default(''),
  GROQ_ENABLED: z.coerce.boolean().default(false),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_BASE_URL: z
    .string()
    .default('https://generativelanguage.googleapis.com/v1beta/openai/'),
  GEMINI_ENABLED: z.coerce.boolean().default(false),

  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_BASE_URL: z.string().default('https://api.openrouter.ai/v1'),
  OPENROUTER_ENABLED: z.coerce.boolean().default(false),

  // Stable Diffusion
  STABLE_DIFFUSION_URL: z.string().default('http://localhost:7860'),
  STABLE_DIFFUSION_ENABLED: z.coerce.boolean().default(true),

  // Images
  IMAGES_DIR: z.string().default('./generated-images'),
  IMAGES_MAX_FILE_SIZE: z.coerce.number().default(50 * 1024 * 1024), // 50MB
  IMAGES_ALLOWED_FORMATS: z.string().default('png,jpg,jpeg,webp'),

  // Web
  WEB_DIST_DIR: z.string().default('./apps/web/dist'),

  // Offline mode
  OFFLINE_ENABLED: z.coerce.boolean().default(false),
  OFFLINE_AUTO_DETECT: z.coerce.boolean().default(true),

  // Custom model for offline preparation
  OFFLINE_MODEL: z.string().default('Xenova/whisper-tiny'),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

// Helper functions for common operations
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const getWhisperAllowedModels = (): string[] => {
  return env.WHISPER_ALLOWED_MODELS.split(',').map((s) => s.trim());
};

export const getImagesAllowedFormats = (): string[] => {
  return env.IMAGES_ALLOWED_FORMATS.split(',').map((s) => s.trim());
};

// AI Provider helpers
export const getAiProviderConfig = (
  provider: 'ollama' | 'lmstudio' | 'openai' | 'groq' | 'gemini' | 'openrouter'
) => {
  switch (provider) {
    case 'ollama':
      return {
        baseUrl: env.OLLAMA_BASE_URL,
        apiKey: env.OLLAMA_API_KEY,
        enabled: env.OLLAMA_ENABLED,
      };
    case 'lmstudio':
      return {
        baseUrl: env.LMSTUDIO_BASE_URL,
        apiKey: env.LMSTUDIO_API_KEY,
        enabled: env.LMSTUDIO_ENABLED,
      };
    case 'openai':
      return {
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL,
        enabled: env.OPENAI_ENABLED,
      };
    case 'groq':
      return {
        apiKey: env.GROQ_API_KEY,
        enabled: env.GROQ_ENABLED,
      };
    case 'gemini':
      return {
        apiKey: env.GEMINI_API_KEY,
        baseUrl: env.GEMINI_BASE_URL,
        enabled: env.GEMINI_ENABLED,
      };
    case 'openrouter':
      return {
        apiKey: env.OPENROUTER_API_KEY,
        baseUrl: env.OPENROUTER_BASE_URL,
        enabled: env.OPENROUTER_ENABLED,
      };
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
};

export const isAiProviderEnabled = (
  provider: 'ollama' | 'lmstudio' | 'openai' | 'groq' | 'gemini' | 'openrouter'
): boolean => {
  const config = getAiProviderConfig(provider);
  return config.enabled;
};

export const getAiProviderApiKey = (
  provider: 'ollama' | 'lmstudio' | 'openai' | 'groq' | 'gemini' | 'openrouter'
): string | undefined => {
  const config = getAiProviderConfig(provider);
  return 'apiKey' in config ? config.apiKey : undefined;
};

export const getAiProviderBaseUrl = (
  provider: 'ollama' | 'lmstudio' | 'openai' | 'groq' | 'gemini' | 'openrouter'
): string | undefined => {
  const config = getAiProviderConfig(provider);
  return 'baseUrl' in config ? config.baseUrl : undefined;
};

import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Directory creation helper
export const ensureDirectoriesExist = (): void => {
  const directories = [
    dirname(env.DATABASE_FILE),
    env.WHISPER_MODELS_DIR,
    env.WHISPER_CACHE_DIR,
    env.IMAGES_DIR,
  ];

  for (const dir of directories) {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (error) {
      console.warn(`Failed to create directory ${dir}:`, error);
    }
  }
};

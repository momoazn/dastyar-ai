import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Default configuration values
const defaultConfig = {
  // Server configuration
  PORT: 3000,
  HOST: '127.0.0.1',
  CORS_ORIGIN: '*',

  // Database
  DATABASE_FILE: './data.db',

  // Whisper configuration
  WHISPER_MODELS_DIR: './whisper-models',
  WHISPER_CACHE_DIR: './.whisper-cache',
  WHISPER_WASM_DIR:
    './node_modules/.bun/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist',
  WHISPER_ALLOW_REMOTE_MODELS: false,
  WHISPER_ALLOWED_MODELS: 'Xenova/whisper-tiny',

  // AI Providers
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_API_KEY: 'ollama',
  OLLAMA_ENABLED: true,

  LMSTUDIO_BASE_URL: 'http://localhost:1234/v1',
  LMSTUDIO_API_KEY: 'lmstudio',
  LMSTUDIO_ENABLED: false,

  OPENAI_API_KEY: '',
  OPENAI_BASE_URL: '',
  OPENAI_ENABLED: false,

  GROQ_API_KEY: '',
  GROQ_ENABLED: false,

  GEMINI_API_KEY: '',
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  GEMINI_ENABLED: false,

  OPENROUTER_API_KEY: '',
  OPENROUTER_BASE_URL: 'https://api.openrouter.ai/v1',
  OPENROUTER_ENABLED: false,

  // Stable Diffusion
  STABLE_DIFFUSION_URL: 'http://localhost:7860',
  STABLE_DIFFUSION_ENABLED: true,

  // Images
  IMAGES_DIR: './generated-images',
  IMAGES_MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  IMAGES_ALLOWED_FORMATS: 'png,jpg,jpeg,webp',

  // Web
  WEB_DIST_DIR: './apps/web/dist',

  // Offline mode
  OFFLINE_ENABLED: false,
  OFFLINE_AUTO_DETECT: true,

  // Custom model for offline preparation
  OFFLINE_MODEL: 'Xenova/whisper-tiny',
};

// Configuration schema with validation
const configSchema = z.object({
  // Server configuration
  PORT: z.coerce.number().default(defaultConfig.PORT),
  HOST: z.string().default(defaultConfig.HOST),
  CORS_ORIGIN: z.string().default(defaultConfig.CORS_ORIGIN),

  // Database
  DATABASE_FILE: z.string().default(defaultConfig.DATABASE_FILE),

  // Whisper configuration
  WHISPER_MODELS_DIR: z.string().default(defaultConfig.WHISPER_MODELS_DIR),
  WHISPER_CACHE_DIR: z.string().default(defaultConfig.WHISPER_CACHE_DIR),
  WHISPER_WASM_DIR: z.string().default(defaultConfig.WHISPER_WASM_DIR),
  WHISPER_ALLOW_REMOTE_MODELS: z.coerce
    .boolean()
    .default(defaultConfig.WHISPER_ALLOW_REMOTE_MODELS),
  WHISPER_ALLOWED_MODELS: z
    .string()
    .default(defaultConfig.WHISPER_ALLOWED_MODELS),

  // AI Providers
  OLLAMA_BASE_URL: z.string().default(defaultConfig.OLLAMA_BASE_URL),
  OLLAMA_ENABLED: z.coerce.boolean().default(defaultConfig.OLLAMA_ENABLED),

  LMSTUDIO_BASE_URL: z.string().default(defaultConfig.LMSTUDIO_BASE_URL),
  LMSTUDIO_ENABLED: z.coerce.boolean().default(defaultConfig.LMSTUDIO_ENABLED),

  GROQ_API_KEY: z.string().default(defaultConfig.GROQ_API_KEY),
  GROQ_ENABLED: z.coerce.boolean().default(defaultConfig.GROQ_ENABLED),

  GEMINI_API_KEY: z.string().default(defaultConfig.GEMINI_API_KEY),
  GEMINI_BASE_URL: z.string().default(defaultConfig.GEMINI_BASE_URL),
  GEMINI_ENABLED: z.coerce.boolean().default(defaultConfig.GEMINI_ENABLED),

  OPENROUTER_API_KEY: z.string().default(defaultConfig.OPENROUTER_API_KEY),
  OPENROUTER_BASE_URL: z.string().default(defaultConfig.OPENROUTER_BASE_URL),
  OPENROUTER_ENABLED: z.coerce
    .boolean()
    .default(defaultConfig.OPENROUTER_ENABLED),

  // Stable Diffusion
  STABLE_DIFFUSION_URL: z.string().default(defaultConfig.STABLE_DIFFUSION_URL),
  STABLE_DIFFUSION_ENABLED: z.coerce
    .boolean()
    .default(defaultConfig.STABLE_DIFFUSION_ENABLED),

  // Images
  IMAGES_DIR: z.string().default(defaultConfig.IMAGES_DIR),
  IMAGES_MAX_FILE_SIZE: z.coerce
    .number()
    .default(defaultConfig.IMAGES_MAX_FILE_SIZE),
  IMAGES_ALLOWED_FORMATS: z
    .string()
    .default(defaultConfig.IMAGES_ALLOWED_FORMATS),

  // Web
  WEB_DIST_DIR: z.string().default(defaultConfig.WEB_DIST_DIR),

  // Offline mode
  OFFLINE_ENABLED: z.coerce.boolean().default(defaultConfig.OFFLINE_ENABLED),
  OFFLINE_AUTO_DETECT: z.coerce
    .boolean()
    .default(defaultConfig.OFFLINE_AUTO_DETECT),

  // Custom model for offline preparation
  OFFLINE_MODEL: z.string().default(defaultConfig.OFFLINE_MODEL),
});

// Load configuration from file or create default
function loadConfig(): Record<string, unknown> {
  const modulePath = fileURLToPath(import.meta.url);
  const isCompiled = modulePath.includes('$bunfs');
  const execDir = dirname(process.execPath);

  // Determine where to read/write config.json
  const envConfigPath = process.env.APP_CONFIG
    ? resolve(process.env.APP_CONFIG)
    : undefined;
  const defaultConfigPath = isCompiled
    ? join(execDir, 'config.json')
    : resolve('./config.json');
  const configPath = envConfigPath ?? defaultConfigPath;

  // Prepare runtime-aware defaults (compiled binary should use co-located absolute paths)
  const runtimeDefaults = { ...defaultConfig } as Record<string, unknown>;
  if (isCompiled) {
    runtimeDefaults.DATABASE_FILE = join(execDir, 'data.db');
    runtimeDefaults.WHISPER_MODELS_DIR = join(execDir, 'whisper-models');
    runtimeDefaults.WHISPER_CACHE_DIR = join(execDir, '.whisper-cache');
    runtimeDefaults.WHISPER_WASM_DIR = join(execDir, 'wasm');
    runtimeDefaults.IMAGES_DIR = join(execDir, 'generated-images');
    runtimeDefaults.WEB_DIST_DIR = join(execDir, 'web');
  }

  let existingConfig: Record<string, unknown> = {};

  try {
    const configContent = readFileSync(configPath, 'utf-8');
    existingConfig = JSON.parse(configContent);
    console.log('Loaded existing config.json');
  } catch (_error) {
    console.warn('Config file not found, will create default config.json');
  }

  // Merge existing config with defaults (existing values take precedence)
  const mergedConfig = { ...runtimeDefaults, ...existingConfig };

  // Always write the complete merged config back to disk
  try {
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
    if (Object.keys(existingConfig).length === 0) {
      console.log('Created default config.json');
    } else {
      console.log('Updated config.json with any missing default values');
    }
  } catch (_writeError) {
    console.error('Failed to write config.json:', _writeError);
    process.exit(1);
  }

  return mergedConfig;
}

// Parse and validate configuration
const configData = loadConfig();
const parsedConfig = configSchema.safeParse(configData);

if (!parsedConfig.success) {
  console.error('❌ Invalid config:');
  console.error(parsedConfig.error.format());
  process.exit(1);
}

export const config = parsedConfig.data;

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// ============================================================================
// CONFIGURATION PARSING HELPERS
// ============================================================================

export const getWhisperAllowedModels = (): string[] => {
  return config.WHISPER_ALLOWED_MODELS.split(',').map((s) => s.trim());
};

export const getImagesAllowedFormats = (): string[] => {
  return config.IMAGES_ALLOWED_FORMATS.split(',').map((s) => s.trim());
};

// ============================================================================
// AI PROVIDER HELPERS
// ============================================================================

type Provider = 'ollama' | 'lmstudio' | 'groq' | 'gemini' | 'openrouter';

export const getAiProviderConfig = (provider: Provider) => {
  switch (provider) {
    case 'ollama':
      return {
        baseUrl: config.OLLAMA_BASE_URL,
        enabled: config.OLLAMA_ENABLED,
      };
    case 'lmstudio':
      return {
        baseUrl: config.LMSTUDIO_BASE_URL,
        enabled: config.LMSTUDIO_ENABLED,
      };
    case 'groq':
      return {
        apiKey: config.GROQ_API_KEY,
        enabled: config.GROQ_ENABLED,
      };
    case 'gemini':
      return {
        apiKey: config.GEMINI_API_KEY,
        baseUrl: config.GEMINI_BASE_URL,
        enabled: config.GEMINI_ENABLED,
      };
    case 'openrouter':
      return {
        apiKey: config.OPENROUTER_API_KEY,
        baseUrl: config.OPENROUTER_BASE_URL,
        enabled: config.OPENROUTER_ENABLED,
      };
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
};

export const isAiProviderEnabled = (provider: Provider): boolean => {
  const providerConfig = getAiProviderConfig(provider);
  return providerConfig.enabled;
};

export const getAiProviderApiKey = (provider: Provider): string | undefined => {
  const providerConfig = getAiProviderConfig(provider);
  return 'apiKey' in providerConfig ? providerConfig.apiKey : undefined;
};

export const getAiProviderBaseUrl = (
  provider: Provider
): string | undefined => {
  const providerConfig = getAiProviderConfig(provider);
  return 'baseUrl' in providerConfig ? providerConfig.baseUrl : undefined;
};

// ============================================================================
// DIRECTORY MANAGEMENT HELPERS
// ============================================================================

export const ensureDirectoriesExist = (): void => {
  const directories: string[] = [
    dirname(config.DATABASE_FILE),
    config.WHISPER_MODELS_DIR,
    config.WHISPER_CACHE_DIR,
    config.IMAGES_DIR,
  ];

  // Deduplicate and skip current directory references ('.' or './')
  const uniqueDirectories = Array.from(new Set(directories)).filter(
    (dir) => dir !== '.' && dir !== './'
  );

  for (const dir of uniqueDirectories) {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (_error) {
      console.warn(`Failed to create directory ${dir}:`, _error);
    }
  }
};

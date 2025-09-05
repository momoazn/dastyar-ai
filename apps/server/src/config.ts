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
  WHISPER_MODELS: ['Xenova/whisper-tiny'],

  // AI Providers
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_API_KEY: 'ollama',
  OLLAMA_ENABLED: true,

  LMSTUDIO_BASE_URL: 'http://localhost:1234/v1',
  LMSTUDIO_API_KEY: 'lmstudio',
  LMSTUDIO_ENABLED: false,

  // Stable Diffusion
  STABLE_DIFFUSION_URL: 'http://localhost:7860',
  STABLE_DIFFUSION_ENABLED: true,

  // Images
  IMAGES_DIR: './generated-images',

  // Web
  WEB_DIST_DIR: './web',
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
  WHISPER_MODELS: z.array(z.string()).default(defaultConfig.WHISPER_MODELS),

  // AI Providers
  OLLAMA_BASE_URL: z.string().default(defaultConfig.OLLAMA_BASE_URL),
  OLLAMA_ENABLED: z.coerce.boolean().default(defaultConfig.OLLAMA_ENABLED),

  LMSTUDIO_BASE_URL: z.string().default(defaultConfig.LMSTUDIO_BASE_URL),
  LMSTUDIO_ENABLED: z.coerce.boolean().default(defaultConfig.LMSTUDIO_ENABLED),

  // Stable Diffusion
  STABLE_DIFFUSION_URL: z.string().default(defaultConfig.STABLE_DIFFUSION_URL),
  STABLE_DIFFUSION_ENABLED: z.coerce
    .boolean()
    .default(defaultConfig.STABLE_DIFFUSION_ENABLED),

  // Images
  IMAGES_DIR: z.string().default(defaultConfig.IMAGES_DIR),

  // Web
  WEB_DIST_DIR: z.string().default(defaultConfig.WEB_DIST_DIR),
});

// Load configuration from file or create default
function loadConfig(): Record<string, unknown> {
  const modulePath = fileURLToPath(import.meta.url);
  const isCompiled = modulePath.includes('$bunfs');
  const execDir = dirname(process.execPath);

  // Ensure production environment when running compiled binary
  if (isCompiled && process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'production';
  }

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

// Normalize and resolve file system paths for cross-platform compatibility (Windows, Linux, macOS)
function normalizeFsPath(p: string): string {
  // Treat empty strings as current working directory
  if (!p || p.trim().length === 0) {
    return resolve('.');
  }
  // If it looks like a file URL, let URL utilities handle Windows drive letters
  if (p.startsWith('file:')) {
    try {
      return fileURLToPath(new URL(p));
    } catch {
      // fall through to resolve
    }
  }
  // Otherwise resolve relative paths against the current working directory
  return resolve(p);
}

export const config = {
  ...parsedConfig.data,
  // Normalize key file system paths
  DATABASE_FILE: normalizeFsPath(parsedConfig.data.DATABASE_FILE),
  WHISPER_MODELS_DIR: normalizeFsPath(parsedConfig.data.WHISPER_MODELS_DIR),
  WHISPER_CACHE_DIR: normalizeFsPath(parsedConfig.data.WHISPER_CACHE_DIR),
  IMAGES_DIR: normalizeFsPath(parsedConfig.data.IMAGES_DIR),
  WEB_DIST_DIR: normalizeFsPath(parsedConfig.data.WEB_DIST_DIR),
} as typeof parsedConfig.data;

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

export const getWhisperModels = (): string[] => {
  return config.WHISPER_MODELS;
};

// ============================================================================
// AI PROVIDER HELPERS
// ============================================================================

type Provider = 'ollama' | 'lmstudio';

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

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
};

export const isAiProviderEnabled = (provider: Provider): boolean => {
  const providerConfig = getAiProviderConfig(provider);
  return providerConfig.enabled;
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

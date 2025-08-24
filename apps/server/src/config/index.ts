import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// AI Provider Configuration
export const ModelProviderEnum = {
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
  GEMINI: 'gemini',
  OPENROUTER: 'openrouter',
  GROQ: 'groq',
} as const;

export type ModelProvider =
  (typeof ModelProviderEnum)[keyof typeof ModelProviderEnum];

export type MinimalModel = { id: string };

export type ProviderId =
  (typeof ModelProviderEnum)[keyof typeof ModelProviderEnum];

export type ProviderFactory = (name: string) => unknown;

export type ProviderListFn = () => Promise<MinimalModel[]>;

export type ProviderFactoriesRegistry = Partial<
  Record<ProviderId, ProviderFactory>
>;

export type ProviderListRegistry = Partial<Record<ProviderId, ProviderListFn>>;

export type AppConfig = {
  server: {
    port: number;
    corsOrigin: string;
    host: string;
  };
  logging: {
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';
    dir: string;
    file: string; // resolved full path
    pretty: boolean; // pretty print to console in development
    redactPaths: string[]; // pino redact paths
    enableHttpLogging: boolean; // hono/orpc request logs
  };
  web: {
    distDir: string;
  };
  database: {
    file: string;
  };
  whisper: {
    modelsDir: string;
    cacheDir: string;
    wasmDir: string;
    allowRemoteModels: boolean;
    allowedModels: string[];
  };
  ai: {
    providers: {
      ollama?: {
        baseUrl: string;
        apiKey: string;
        enabled: boolean;
        models: readonly string[];
      };
      lmstudio?: {
        baseUrl: string;
        apiKey: string;
        enabled: boolean;
        models: readonly string[];
      };
      openai?: {
        apiKey?: string;
        baseUrl?: string;
        enabled: boolean;
      };
      groq?: {
        apiKey?: string;
        enabled: boolean;
        models: readonly string[];
      };
      gemini?: {
        apiKey?: string;
        baseUrl: string;
        enabled: boolean;
        models: readonly string[];
      };
      openrouter?: {
        apiKey?: string;
        baseUrl: string;
        enabled: boolean;
        models: readonly string[];
      };
    };
  };
  stableDiffusion: {
    url: string;
    enabled: boolean;
  };
  images: {
    dir: string;
    maxFileSize: number; // in bytes
    allowedFormats: string[];
  };
  environment: 'development' | 'production';
};

// Environment detection
const detectEnvironment = (): 'development' | 'production' => {
  // Check if we're running as a compiled binary
  // For Bun binaries, process.execPath will be the binary path
  if (
    process.execPath?.endsWith('dastyar-ai') ||
    process.execPath?.endsWith('dastyar-ai.exe') ||
    process.argv[0]?.endsWith('dastyar-ai') ||
    process.argv[0]?.endsWith('dastyar-ai.exe')
  ) {
    return 'production';
  }

  // Check if execPath contains our binary name (handles different paths)
  if (process.execPath?.includes('dastyar-ai')) {
    return 'production';
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  // Check if we're running with bun --hot (development)
  if (process.argv.includes('--hot')) {
    return 'development';
  }

  // Default to development for bun run dev
  return 'development';
};

const environment = detectEnvironment();

// Get workspace root directory
const getWorkspaceRoot = (): string => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  // In dev: apps/server/src/config -> go up 4 levels to workspace root
  // In binary: config is next to binary, so execPath is already at root level
  return environment === 'development'
    ? path.resolve(currentDir, '..', '..', '..', '..')
    : path.dirname(process.execPath);
};

const workspaceRoot = getWorkspaceRoot();

// Development-specific defaults
const getDevelopmentDefaults = (): AppConfig => ({
  server: {
    port: 3000,
    corsOrigin: 'http://localhost:3001',
    host: '127.0.0.1',
  },
  logging: {
    level: 'debug',
    dir: path.join(workspaceRoot, 'logs'),
    file: '',
    pretty: true,
    redactPaths: [
      'ai.providers.openai.apiKey',
      'ai.providers.groq.apiKey',
      'ai.providers.gemini.apiKey',
      'ai.providers.openrouter.apiKey',
    ],
    enableHttpLogging: true,
  },
  web: {
    distDir: path.join(workspaceRoot, 'apps', 'web', 'dist'),
  },
  database: {
    file: path.join(workspaceRoot, 'apps', 'server', 'data.db'),
  },
  whisper: {
    modelsDir: path.join(workspaceRoot, 'whisper-models'),
    cacheDir: path.join(workspaceRoot, '.whisper-cache'),
    wasmDir: path.join(
      workspaceRoot,
      'node_modules',
      '.bun',
      '@huggingface+transformers@*',
      'node_modules',
      '@huggingface',
      'transformers',
      'dist'
    ),
    allowRemoteModels: true,
    allowedModels: ['Xenova/whisper-tiny', 'Xenova/whisper-base'],
  },
  ai: {
    providers: {
      ollama: {
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'ollama',
        enabled: true,
        models: [],
      },
      lmstudio: {
        baseUrl: 'http://localhost:1234/v1',
        apiKey: 'lmstudio',
        enabled: true,
        models: [],
      },
      openai: {
        apiKey: '',
        baseUrl: '',
        enabled: false,
      },
      groq: {
        apiKey: '',
        enabled: false,
        models: [
          'gemma2-9b-it',
          'llama-3.1-8b-instant',
          'llama-3.3-70b-versatile',
          'meta-llama/llama-guard-4-12b',
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'deepseek-r1-distill-llama-70b',
          'meta-llama/llama-4-maverick-17b-128e-instruct',
          'meta-llama/llama-4-scout-17b-16e-instruct',
          'meta-llama/llama-prompt-guard-2-22m',
          'meta-llama/llama-prompt-guard-2-86m',
          'mistral-saba-24b',
          'moonshotai/kimi-k2-instruct',
          'qwen/qwen3-32b',
          'llama-guard-3-8b',
          'llama3-70b-8192',
          'llama3-8b-8192',
          'mixtral-8x7b-32768',
          'qwen-qwq-32b',
          'qwen-2.5-32b',
          'deepseek-r1-distill-qwen-32b',
        ],
      },
      gemini: {
        apiKey: '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        enabled: false,
        models: [
          'gemini-2.0-flash',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash-lite',
          'gemini-2.0-pro-exp-02-05',
          'gemini-2.0-flash-thinking-exp-01-21',
          'gemini-2.0-flash-exp',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
          'gemini-2.0-pro-exp-03-25',
          'gemini-2.5-flash-preview-04-17',
          'gemma-3-12b-it',
          'gemma-3-27b-it',
        ],
      },
      openrouter: {
        apiKey: '',
        baseUrl: 'https://api.openrouter.ai/v1',
        enabled: false,
        models: [
          'openai/gpt-oss-20b:free',
          'z-ai/glm-4.5-air:free',
          'qwen/qwen3-coder:free',
          'moonshotai/kimi-k2:free',
          'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
          'google/gemma-3n-e2b-it:free',
          'tencent/hunyuan-a13b-instruct:free',
          'tngtech/deepseek-r1t2-chimera:free',
          'mistralai/mistral-small-3.2-24b-instruct:free',
          'moonshotai/kimi-dev-72b:free',
          'deepseek/deepseek-r1-0528-qwen3-8b:free',
          'deepseek/deepseek-r1-0528:free',
          'microsoft/mai-ds-r1:free',
          'qwen/qwen2.5-vl-32b-instruct:free',
        ],
      },
    },
  },
  stableDiffusion: {
    url: 'http://localhost:7860',
    enabled: true,
  },
  images: {
    dir: path.join(workspaceRoot, 'generated-images'),
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
  },
  environment: 'development',
});

// Production-specific defaults (for binary deployment)
const getProductionDefaults = (): AppConfig => {
  const execDir = path.dirname(process.execPath);

  return {
    server: {
      port: 3000,
      corsOrigin: '*',
      host: '0.0.0.0',
    },
    logging: {
      level: 'info',
      dir: path.join(execDir, 'logs'),
      file: '',
      pretty: true,
      redactPaths: [
        'ai.providers.openai.apiKey',
        'ai.providers.groq.apiKey',
        'ai.providers.gemini.apiKey',
        'ai.providers.openrouter.apiKey',
      ],
      enableHttpLogging: true,
    },
    web: {
      distDir: path.join(execDir, 'web'),
    },
    database: {
      file: path.join(execDir, 'data.db'),
    },
    whisper: {
      modelsDir: path.join(execDir, 'whisper-models'),
      cacheDir: path.join(execDir, '.whisper-cache'),
      wasmDir: path.join(execDir, 'wasm'),
      allowRemoteModels: false, // Offline by default in production
      allowedModels: ['Xenova/whisper-tiny'], // Conservative default for offline
    },
    ai: {
      providers: {
        ollama: {
          baseUrl: 'http://localhost:11434/v1',
          apiKey: 'ollama',
          enabled: true,
          models: [],
        },
        lmstudio: {
          baseUrl: 'http://localhost:1234/v1',
          apiKey: 'lmstudio',
          enabled: false,
          models: [],
        },
        openai: {
          apiKey: '',
          baseUrl: '',
          enabled: false,
        },
        groq: {
          apiKey: '',
          enabled: false,
          models: [],
        },
        gemini: {
          apiKey: '',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          enabled: false,
          models: [],
        },
        openrouter: {
          apiKey: '',
          baseUrl: 'https://api.openrouter.ai/v1',
          enabled: false,
          models: [],
        },
      },
    },
    stableDiffusion: {
      url: 'http://localhost:7860',
      enabled: true,
    },
    images: {
      dir: path.join(execDir, 'generated-images'),
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
    },
    environment: 'production',
  };
};

let cachedConfig: AppConfig | null = null;

const validateConfig = (config: AppConfig): void => {
  // Validate essential directories exist in production
  if (config.environment === 'production') {
    if (!fs.existsSync(config.database.file)) {
      const dbDir = path.dirname(config.database.file);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }

    // Ensure whisper directories exist
    if (!fs.existsSync(config.whisper.modelsDir)) {
      fs.mkdirSync(config.whisper.modelsDir, { recursive: true });
    }

    if (!fs.existsSync(config.whisper.cacheDir)) {
      fs.mkdirSync(config.whisper.cacheDir, { recursive: true });
    }

    // Ensure image directories exist
    if (!fs.existsSync(config.images.dir)) {
      fs.mkdirSync(config.images.dir, { recursive: true });
    }

    // thumbnailDir removed from type; ensure only base dir exists in prod
  }

  // Ensure logging directory exists and compute file path
  if (!fs.existsSync(config.logging.dir)) {
    fs.mkdirSync(config.logging.dir, { recursive: true });
  }
  // default logfile path
  (config.logging as { file: string }).file = path.join(
    config.logging.dir,
    'server.log'
  );

  // Validate port
  if (config.server.port < 1 || config.server.port > 65_535) {
    throw new Error(
      `Invalid port: ${config.server.port}. Must be between 1 and 65535.`
    );
  }
};

const readJsonConfig = (filePath: string): Partial<AppConfig> | null => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    console.log(`📄 Loaded config from: ${filePath}`);
    return parsed;
  } catch (error) {
    console.warn(`⚠️  Failed to read config from ${filePath}:`, error);
    return null;
  }
};

const mergeDeep = <T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T => {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeDeep(
        (base as Record<string, unknown>)[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
};

export const getConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  console.log(`🚀 Starting in ${environment} mode`);

  // Start with environment-specific defaults
  let config: AppConfig =
    environment === 'development'
      ? getDevelopmentDefaults()
      : getProductionDefaults();

  // Config resolution order (highest priority first)
  const configCandidates: string[] = [];

  // 1. Environment-specific config files (highest priority)
  if (environment === 'development') {
    configCandidates.push(path.join(workspaceRoot, 'config.dev.json'));
  } else {
    configCandidates.push(path.join(workspaceRoot, 'config.prod.json'));
  }

  // 2. Generic config file
  configCandidates.push(path.join(workspaceRoot, 'config.json'));

  // 3. Environment variable pointing to custom config file
  if (process.env.APP_CONFIG) {
    configCandidates.push(process.env.APP_CONFIG);
  }

  // 4. Config file next to binary (production) or in workspace root (development)
  if (environment === 'production') {
    configCandidates.push(
      path.join(path.dirname(process.execPath), 'config.json')
    );
    // Also look for sample config next to binary
    configCandidates.push(
      path.join(path.dirname(process.execPath), 'config.prod.sample.json')
    );
  } else {
    configCandidates.push(
      path.join(workspaceRoot, 'apps', 'server', 'config.json')
    );
  }

  // 5. Fallback to sample config files if no actual configs found
  if (environment === 'development') {
    configCandidates.push(path.join(workspaceRoot, 'config.dev.sample.json'));
  } else {
    configCandidates.push(path.join(workspaceRoot, 'config.prod.sample.json'));
  }

  // Load and merge config files
  for (const configPath of configCandidates) {
    const configData = readJsonConfig(configPath);
    if (configData) {
      console.log(`📄 Loading config from: ${configPath}`);
      config = mergeDeep(config, configData);
      break; // Use first found config file
    }
  }

  // Validate the final configuration
  try {
    validateConfig(config);
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }

  // Log key configuration info
  console.log(
    `🔧 Server will run on ${config.server.host}:${config.server.port}`
  );
  console.log(`💾 Database: ${config.database.file}`);
  console.log(`🌐 Web assets: ${config.web.distDir}`);
  console.log(
    `🪵 Logs: ${config.logging.file} (level: ${config.logging.level})`
  );
  console.log(
    `🎙️  Whisper models: ${config.whisper.modelsDir} (remote: ${config.whisper.allowRemoteModels})`
  );

  // Cache and return
  cachedConfig = config;
  return config;
};

// Export helper functions
export const isDevelopment = (): boolean => environment === 'development';
export const isProduction = (): boolean => environment === 'production';

// AI Provider configuration helpers
export const getAiProviderConfig = (provider: ModelProvider) => {
  const config = getConfig();
  return config.ai.providers[provider];
};

export const isAiProviderEnabled = (provider: ModelProvider): boolean => {
  const providerConfig = getAiProviderConfig(provider);
  return providerConfig?.enabled === true;
};

export const getAiProviderApiKey = (
  provider: ModelProvider
): string | undefined => {
  const providerConfig = getAiProviderConfig(provider);
  return providerConfig?.apiKey;
};

export const getAiProviderBaseUrl = (
  provider: ModelProvider
): string | undefined => {
  const providerConfig = getAiProviderConfig(provider);
  if (providerConfig && 'baseUrl' in providerConfig) {
    return providerConfig.baseUrl;
  }
  return;
};

export const getAiProviderModels = (
  provider: ModelProvider
): readonly string[] => {
  const providerConfig = getAiProviderConfig(provider);
  return providerConfig?.models || [];
};

// Create a sample config file for reference
export const createSampleConfig = (outputPath: string): void => {
  const sampleConfig = {
    server: {
      port: 8080,
      corsOrigin: 'https://yourdomain.com',
      host: '0.0.0.0',
    },
    database: {
      file: './custom-data.db',
    },
    whisper: {
      allowRemoteModels: false,
      allowedModels: ['Xenova/whisper-base', 'Xenova/whisper-small'],
    },
    ai: {
      providers: {
        ollama: {
          baseUrl: 'http://localhost:11434/v1',
          apiKey: 'ollama',
          enabled: true,
          models: [],
        },
        lmstudio: {
          baseUrl: 'http://localhost:1234/v1',
          apiKey: 'lmstudio',
          enabled: true,
          models: [],
        },
        openai: {
          apiKey: 'your-openai-api-key-here',
        },
        groq: {
          apiKey: 'your-groq-api-key-here',
          enabled: true,
          models: ['gemma2-9b-it', 'llama-3.1-8b-instant'],
        },
        gemini: {
          apiKey: 'your-google-api-key-here',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          enabled: true,
          models: ['gemini-2.0-flash', 'gemini-2.5-flash'],
        },
        openrouter: {
          apiKey: 'your-openrouter-api-key-here',
          baseUrl: 'https://api.openrouter.ai/v1',
          enabled: true,
          models: ['openai/gpt-oss-20b:free', 'z-ai/glm-4.5-air:free'],
        },
      },
    },
    stableDiffusion: {
      url: 'http://your-sd-server:7860',
      enabled: true,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(sampleConfig, null, 2), 'utf8');
  console.log(`📝 Sample config written to: ${outputPath}`);
};

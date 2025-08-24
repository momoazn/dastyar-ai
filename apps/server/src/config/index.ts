import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
      openai?: {
        apiKey?: string;
        baseUrl?: string;
      };
      groq?: {
        apiKey?: string;
      };
      gemini?: {
        apiKey?: string;
      };
      openrouter?: {
        apiKey?: string;
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
    port: Number(process.env.SERVER_PORT) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    host: '127.0.0.1',
  },
  logging: {
    level: (process.env.LOG_LEVEL as AppConfig['logging']['level']) || 'debug',
    dir: process.env.LOG_DIR || path.join(getWorkspaceRoot(), 'logs'),
    file: '',
    pretty: process.env.LOG_PRETTY !== 'false',
    redactPaths: [
      'ai.providers.openai.apiKey',
      'ai.providers.groq.apiKey',
      'ai.providers.gemini.apiKey',
      'ai.providers.openrouter.apiKey',
    ],
    enableHttpLogging: true,
  },
  web: {
    distDir:
      process.env.WEB_DIST_DIR ||
      path.join(workspaceRoot, 'apps', 'web', 'dist'),
  },
  database: {
    file:
      process.env.DATABASE_URL ||
      path.join(workspaceRoot, 'apps', 'server', 'data.db'),
  },
  whisper: {
    modelsDir:
      process.env.MODELS_DIR || path.join(workspaceRoot, 'whisper-models'),
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
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY,
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
      },
    },
  },
  stableDiffusion: {
    url: process.env.STABLE_DIFFUSION_URL || 'http://localhost:7860',
    enabled: true,
  },
  images: {
    dir: process.env.IMAGES_DIR || path.join(workspaceRoot, 'generated-images'),
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
      port: Number(process.env.SERVER_PORT) || 3000,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      host: '0.0.0.0',
    },
    logging: {
      level: (process.env.LOG_LEVEL as AppConfig['logging']['level']) || 'info',
      dir: process.env.LOG_DIR || path.join(execDir, 'logs'),
      file: '',
      pretty: false,
      redactPaths: [
        'ai.providers.openai.apiKey',
        'ai.providers.groq.apiKey',
        'ai.providers.gemini.apiKey',
        'ai.providers.openrouter.apiKey',
      ],
      enableHttpLogging: true,
    },
    web: {
      distDir: process.env.WEB_DIST_DIR || path.join(execDir, 'web'),
    },
    database: {
      file: process.env.DATABASE_URL || path.join(execDir, 'data.db'),
    },
    whisper: {
      modelsDir: process.env.MODELS_DIR || path.join(execDir, 'whisper-models'),
      cacheDir: path.join(execDir, '.whisper-cache'),
      wasmDir: path.join(execDir, 'wasm'),
      allowRemoteModels: false, // Offline by default in production
      allowedModels: ['Xenova/whisper-tiny'], // Conservative default for offline
    },
    ai: {
      providers: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: process.env.OPENAI_BASE_URL,
        },
        groq: {
          apiKey: process.env.GROQ_API_KEY,
        },
        gemini: {
          apiKey: process.env.GEMINI_API_KEY,
        },
        openrouter: {
          apiKey: process.env.OPENROUTER_API_KEY,
        },
      },
    },
    stableDiffusion: {
      url: process.env.STABLE_DIFFUSION_URL || 'http://localhost:7860',
      enabled: Boolean(process.env.STABLE_DIFFUSION_ENABLED !== 'false'),
    },
    images: {
      dir: process.env.IMAGES_DIR || path.join(execDir, 'generated-images'),
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

  // 1. Environment variable pointing to config file
  if (process.env.APP_CONFIG) {
    configCandidates.push(process.env.APP_CONFIG);
  }

  // 2. Config file next to binary (production) or in workspace root (development)
  if (environment === 'production') {
    configCandidates.push(
      path.join(path.dirname(process.execPath), 'config.json')
    );
  } else {
    configCandidates.push(path.join(workspaceRoot, 'config.json'));
    configCandidates.push(
      path.join(workspaceRoot, 'apps', 'server', 'config.json')
    );
  }

  // Load and merge config files
  for (const configPath of configCandidates) {
    const configData = readJsonConfig(configPath);
    if (configData) {
      config = mergeDeep(config, configData);
      break; // Use first found config file
    }
  }

  // Apply final environment overrides
  if (process.env.PORT) {
    config.server.port = Number(process.env.PORT);
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
        openai: {
          apiKey: 'your-openai-api-key-here',
        },
        groq: {
          apiKey: 'your-groq-api-key-here',
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

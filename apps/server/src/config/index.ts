import fs from 'node:fs';
import path from 'node:path';
import type { ModelProvider } from '@/utils/constants';

export type AppConfig = {
  server: {
    port: number;
    corsOrigin: string;
    host: string;
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
      };
      lmstudio?: {
        baseUrl: string;
        apiKey: string;
        enabled: boolean;
      };
      openai?: {
        apiKey?: string;
        baseUrl?: string;
        enabled: boolean;
      };
      groq?: {
        apiKey?: string;
        enabled: boolean;
      };
      gemini?: {
        apiKey?: string;
        baseUrl: string;
        enabled: boolean;
      };
      openrouter?: {
        apiKey?: string;
        baseUrl: string;
        enabled: boolean;
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
  offline: {
    enabled: boolean;
    autoDetect: boolean;
    services: {
      ollama: {
        required: boolean;
        autoStart: boolean;
      };
      lmstudio: {
        required: boolean;
        autoStart: boolean;
      };
      stableDiffusion: {
        required: boolean;
        autoStart: boolean;
      };
    };
    models: {
      autoDownload: boolean;
      preferredModel: string;
      cacheStrategy: 'aggressive' | 'conservative' | 'disabled';
    };
    storage: {
      validatePaths: boolean;
      createDirectories: boolean;
      cleanupOrphanedFiles: boolean;
    };
  };
  environment: 'development' | 'production';
  mode: 'online' | 'offline' | 'hybrid';
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

const defaults: AppConfig = {
  server: {
    port: 3000,
    corsOrigin: environment === 'development' ? 'http://localhost:3001' : '*',
    host: environment === 'development' ? '127.0.0.1' : '0.0.0.0',
  },
  web: {
    distDir: './apps/web/dist',
  },
  database: {
    file: './apps/server/data.db',
  },
  whisper: {
    modelsDir: './whisper-models',
    cacheDir: './.whisper-cache',
    wasmDir:
      './node_modules/.bun/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist',
    allowRemoteModels: environment === 'development',
    allowedModels:
      environment === 'development'
        ? ['Xenova/whisper-tiny', 'Xenova/whisper-base']
        : ['Xenova/whisper-tiny'],
  },
  ai: {
    providers: {
      ollama: {
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'ollama',
        enabled: true,
      },
      lmstudio: {
        baseUrl: 'http://localhost:1234/v1',
        apiKey: 'lmstudio',
        enabled: environment === 'development',
      },
      openai: {
        apiKey: '',
        baseUrl: '',
        enabled: false,
      },
      groq: {
        apiKey: '',
        enabled: false,
      },
      gemini: {
        apiKey: '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        enabled: false,
      },
      openrouter: {
        apiKey: '',
        baseUrl: 'https://api.openrouter.ai/v1',
        enabled: false,
      },
    },
  },
  stableDiffusion: {
    url: 'http://localhost:7860',
    enabled: true,
  },
  images: {
    dir: './generated-images',
    maxFileSize: 50 * 1024 * 1024,
    allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
  },
  offline: {
    enabled: false, // Auto-detected based on available services
    autoDetect: true,
    services: {
      ollama: {
        required: true,
        autoStart: false,
      },
      lmstudio: {
        required: false,
        autoStart: false,
      },
      stableDiffusion: {
        required: false,
        autoStart: false,
      },
    },
    models: {
      autoDownload: environment === 'development',
      preferredModel: 'Xenova/whisper-tiny',
      cacheStrategy: 'conservative',
    },
    storage: {
      validatePaths: true,
      createDirectories: true,
      cleanupOrphanedFiles: true,
    },
  },
  environment,
  mode: 'hybrid', // Will be auto-detected
};

let cachedConfig: AppConfig | null = null;

const mergeConfig = <T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T => {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = mergeConfig(
        (base as Record<string, unknown>)[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result as T;
};

export const getConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  let config = { ...defaults };

  // Load from config.json if exists
  const configPath = './config.json';
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(
        fs.readFileSync(configPath, 'utf8')
      ) as Partial<AppConfig>;
      config = mergeConfig(config, userConfig);
    } catch (error) {
      console.warn('Failed to load config.json:', error);
    }
  }

  // Ensure directories exist
  for (const dir of [
    config.database.file,
    config.whisper.modelsDir,
    config.whisper.cacheDir,
    config.images.dir,
  ]) {
    const dirPath = path.dirname(dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  cachedConfig = config;
  return config;
};

export const isDevelopment = (): boolean => environment === 'development';
export const isProduction = (): boolean => environment === 'production';

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

/**
 * Detects the current mode (online, offline, hybrid) based on configuration and available services
 */
export const detectMode = (): 'online' | 'offline' | 'hybrid' => {
  const config = getConfig();

  // If offline mode is explicitly enabled
  if (config.offline.enabled) {
    return 'offline';
  }

  // Check which providers are enabled
  const enabledProviders = Object.entries(config.ai.providers)
    .filter(([_, provider]) => provider?.enabled)
    .map(([name]) => name);

  const hasOnlineProviders = enabledProviders.some((provider) =>
    ['openai', 'groq', 'gemini', 'openrouter'].includes(provider)
  );

  const hasOfflineProviders = enabledProviders.some((provider) =>
    ['ollama', 'lmstudio'].includes(provider)
  );

  if (hasOnlineProviders && hasOfflineProviders) {
    return 'hybrid';
  }
  if (hasOnlineProviders) {
    return 'online';
  }
  if (hasOfflineProviders) {
    return 'offline';
  }

  // Default fallback
  return 'hybrid';
};

/**
 * Checks if a local service is available
 */
export const checkServiceAvailability = async (
  service: 'ollama' | 'lmstudio' | 'stableDiffusion'
): Promise<boolean> => {
  const config = getConfig();

  try {
    switch (service) {
      case 'ollama': {
        const ollamaConfig = config.ai.providers.ollama;
        if (!ollamaConfig?.enabled) {
          return false;
        }

        const response = await fetch(`${ollamaConfig.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      }

      case 'lmstudio': {
        const lmstudioConfig = config.ai.providers.lmstudio;
        if (!lmstudioConfig?.enabled) {
          return false;
        }

        const response = await fetch(`${lmstudioConfig.baseUrl}/v1/models`, {
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      }

      case 'stableDiffusion': {
        if (!config.stableDiffusion.enabled) {
          return false;
        }

        const response = await fetch(
          `${config.stableDiffusion.url}/internal/ping`,
          {
            signal: AbortSignal.timeout(5000),
          }
        );
        return response.ok;
      }

      default:
        return false;
    }
  } catch {
    return false;
  }
};

/**
 * Validates offline configuration requirements
 */
export const validateOfflineConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const config = getConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if offline mode is enabled but no offline providers are configured
  if (config.offline.enabled) {
    const offlineProviders = ['ollama', 'lmstudio'].filter(
      (provider) =>
        config.ai.providers[provider as keyof typeof config.ai.providers]
          ?.enabled
    );

    if (offlineProviders.length === 0) {
      errors.push(
        'Offline mode is enabled but no offline AI providers are configured'
      );
    }

    // Check required services
    if (
      config.offline.services.ollama.required &&
      !config.ai.providers.ollama?.enabled
    ) {
      errors.push('Ollama is required for offline mode but not enabled');
    }

    if (
      config.offline.services.stableDiffusion.required &&
      !config.stableDiffusion.enabled
    ) {
      errors.push(
        'Stable Diffusion is required for offline mode but not enabled'
      );
    }
  }

  // Check file paths
  if (config.offline.storage.validatePaths) {
    const pathsToCheck = [
      config.database.file,
      config.whisper.modelsDir,
      config.whisper.cacheDir,
      config.images.dir,
    ];

    for (const filePath of pathsToCheck) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          if (config.offline.storage.createDirectories) {
            fs.mkdirSync(dir, { recursive: true });
          } else {
            warnings.push(`Directory does not exist: ${dir}`);
          }
        }
      } catch {
        warnings.push(`Cannot validate path: ${filePath}`);
      }
    }
  }

  // Check for online providers when offline mode is preferred
  if (config.offline.enabled) {
    const onlineProviders = ['openai', 'groq', 'gemini', 'openrouter'];
    const enabledOnlineProviders = onlineProviders.filter(
      (provider) =>
        config.ai.providers[provider as keyof typeof config.ai.providers]
          ?.enabled
    );

    if (enabledOnlineProviders.length > 0) {
      warnings.push(
        `Online providers are enabled in offline mode: ${enabledOnlineProviders.join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Gets offline configuration status
 */
export const getOfflineStatus = async (): Promise<{
  mode: 'online' | 'offline' | 'hybrid';
  services: Record<string, boolean>;
  isReady: boolean;
  issues: string[];
}> => {
  const config = getConfig();
  const mode = detectMode();

  const services = {
    ollama: false,
    lmstudio: false,
    stableDiffusion: false,
  };

  // Check service availability
  const serviceChecks = await Promise.allSettled([
    checkServiceAvailability('ollama'),
    checkServiceAvailability('lmstudio'),
    checkServiceAvailability('stableDiffusion'),
  ]);

  services.ollama =
    serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : false;
  services.lmstudio =
    serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : false;
  services.stableDiffusion =
    serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : false;

  // Validate configuration
  const validation = validateOfflineConfig();

  const issues = [...validation.errors, ...validation.warnings];

  // Determine if ready for offline use
  let isReady = true;
  if (config.offline.enabled) {
    if (config.offline.services.ollama.required && !services.ollama) {
      isReady = false;
      issues.push('Ollama is required but not available');
    }
    if (
      config.offline.services.stableDiffusion.required &&
      !services.stableDiffusion
    ) {
      isReady = false;
      issues.push('Stable Diffusion is required but not available');
    }
  }

  return {
    mode,
    services,
    isReady,
    issues,
  };
};

/**
 * Creates a sample configuration file with all available options
 */
export const createSampleConfig = (outputPath: string): void => {
  const sampleConfig: Partial<AppConfig> = {
    server: {
      port: 3000,
      corsOrigin: '*',
      host: '0.0.0.0',
    },
    web: {
      distDir: './web',
    },
    database: {
      file: './data.db',
    },
    whisper: {
      modelsDir: './whisper-models',
      cacheDir: './.whisper-cache',
      wasmDir: './wasm',
      allowRemoteModels: false,
      allowedModels: ['Xenova/whisper-tiny'],
    },
    ai: {
      providers: {
        ollama: {
          baseUrl: 'http://localhost:11434/v1',
          apiKey: 'ollama',
          enabled: true,
        },
        lmstudio: {
          baseUrl: 'http://localhost:1234/v1',
          apiKey: 'lmstudio',
          enabled: false,
        },
        openai: {
          apiKey: '',
          baseUrl: '',
          enabled: false,
        },
        groq: {
          apiKey: '',
          enabled: false,
        },
        gemini: {
          apiKey: '',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          enabled: false,
        },
        openrouter: {
          apiKey: '',
          baseUrl: 'https://api.openrouter.ai/v1',
          enabled: false,
        },
      },
    },
    stableDiffusion: {
      url: 'http://localhost:7860',
      enabled: true,
    },
    images: {
      dir: './generated-images',
      maxFileSize: 52_428_800,
      allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
    },
    offline: {
      enabled: false,
      autoDetect: true,
      services: {
        ollama: {
          required: true,
          autoStart: false,
        },
        lmstudio: {
          required: false,
          autoStart: false,
        },
        stableDiffusion: {
          required: false,
          autoStart: false,
        },
      },
      models: {
        autoDownload: false,
        preferredModel: 'Xenova/whisper-tiny',
        cacheStrategy: 'conservative',
      },
      storage: {
        validatePaths: true,
        createDirectories: true,
        cleanupOrphanedFiles: true,
      },
    },
  };

  // Write the sample config to file
  fs.writeFileSync(outputPath, JSON.stringify(sampleConfig, null, 2));
};

import fs from 'node:fs';
import path from 'node:path';

export type AppConfig = {
  server: {
    port: number;
    corsOrigin: string;
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
};

const DEFAULT_CONFIG: AppConfig = {
  server: {
    port: Number(process.env.SERVER_PORT) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  web: {
    distDir: process.env.WEB_DIST_DIR || '',
  },
  database: {
    file: process.env.DATABASE_URL || '',
  },
  whisper: {
    modelsDir: process.env.MODELS_DIR || '',
    cacheDir: '',
    wasmDir: '',
    allowRemoteModels: process.env.NODE_ENV !== 'production',
    allowedModels: [],
  },
};

let cachedConfig: AppConfig | null = null;

const resolveExecDir = (): string => {
  return path.dirname(process.execPath);
};

const readJsonConfig = (filePath: string): Partial<AppConfig> | null => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return parsed;
  } catch {
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
  const execDir = resolveExecDir();

  const defaultLocal: AppConfig = {
    ...DEFAULT_CONFIG,
    web: {
      distDir: DEFAULT_CONFIG.web.distDir || path.join(execDir, 'web'),
    },
    database: {
      file: DEFAULT_CONFIG.database.file || path.join(execDir, '..', 'data.db'),
    },
    whisper: {
      ...DEFAULT_CONFIG.whisper,
      modelsDir:
        DEFAULT_CONFIG.whisper.modelsDir ||
        path.join(execDir, 'whisper-models'),
      cacheDir:
        DEFAULT_CONFIG.whisper.cacheDir || path.join(execDir, '.whisper-cache'),
      wasmDir: DEFAULT_CONFIG.whisper.wasmDir || path.join(execDir, 'wasm'),
      allowedModels: DEFAULT_CONFIG.whisper.allowedModels || [],
    },
  };

  // Config resolution order: ENV APP_CONFIG -> execDir/config.json -> workspace dist/config.json
  const envPath = process.env.APP_CONFIG;
  const execConfigPath = path.join(execDir, 'config.json');
  const workspaceDistPath = path.join(execDir, 'config.json');
  const candidates = [envPath, execConfigPath, workspaceDistPath].filter(
    Boolean
  ) as string[];

  let config: AppConfig = defaultLocal;
  for (const file of candidates) {
    const data = readJsonConfig(file);
    if (data) {
      config = mergeDeep(config, data);
      break;
    }
  }

  cachedConfig = config;
  return config;
};

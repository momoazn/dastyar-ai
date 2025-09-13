import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// Minimal, practical config with lower snake_case keys
// ----------------------------------------------------------------------------

const defaults = {
  // server
  port: 3000,
  host: '127.0.0.1',
  cors_origin: '*',

  // database
  database_file: './data.db',

  // whisper
  whisper_models_dir: './whisper-models',
  whisper_cache_dir: './.whisper-cache',
  whisper_wasm_dir:
    './node_modules/.bun/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist',
  whisper_models: ['Xenova/whisper-tiny'] as string[],

  // ai providers
  ollama_base_url: 'http://localhost:11434',
  ollama_enabled: true,

  lmstudio_base_url: 'http://localhost:1234/v1',
  lmstudio_enabled: false,

  // image generation
  stable_diffusion_url: 'http://localhost:7860',
  stable_diffusion_enabled: true,

  // assets
  images_dir: './generated-images',
  web_dist_dir: './web',
} as const;

const schema = z.object({
  port: z.coerce.number().default(defaults.port),
  host: z.string().default(defaults.host),
  cors_origin: z.string().default(defaults.cors_origin),

  database_file: z.string().default(defaults.database_file),

  whisper_models_dir: z.string().default(defaults.whisper_models_dir),
  whisper_cache_dir: z.string().default(defaults.whisper_cache_dir),
  whisper_wasm_dir: z.string().default(defaults.whisper_wasm_dir),
  whisper_models: z.array(z.string()).default(defaults.whisper_models),

  ollama_base_url: z.string().default(defaults.ollama_base_url),
  ollama_enabled: z.coerce.boolean().default(defaults.ollama_enabled),

  lmstudio_base_url: z.string().default(defaults.lmstudio_base_url),
  lmstudio_enabled: z.coerce.boolean().default(defaults.lmstudio_enabled),

  stable_diffusion_url: z.string().default(defaults.stable_diffusion_url),
  stable_diffusion_enabled: z.coerce
    .boolean()
    .default(defaults.stable_diffusion_enabled),

  images_dir: z.string().default(defaults.images_dir),
  web_dist_dir: z.string().default(defaults.web_dist_dir),
});

function runningInProduction(): boolean {
  const modulePath = fileURLToPath(import.meta.url);
  return modulePath.includes('$bunfs');
}

function load(): Record<string, unknown> {
  const execDir = dirname(process.execPath);
  if (runningInProduction()) {
    process.env.NODE_ENV = 'production';
  }

  const explicitPath = process.env.APP_CONFIG
    ? resolve(process.env.APP_CONFIG)
    : undefined;
  const defaultPath = runningInProduction()
    ? join(execDir, 'config.json')
    : resolve('./config.json');
  const configPath = explicitPath ?? defaultPath;

  const base: Record<string, unknown> = { ...defaults };
  if (runningInProduction()) {
    base.database_file = join(execDir, 'data.db');
    base.whisper_models_dir = join(execDir, 'whisper-models');
    base.whisper_cache_dir = join(execDir, '.whisper-cache');
    base.whisper_wasm_dir = join(execDir, 'wasm');
    base.images_dir = join(execDir, 'generated-images');
    base.web_dist_dir = join(execDir, 'web');
  }

  let fileConfig: Record<string, unknown> = {};
  try {
    const content = readFileSync(configPath, 'utf-8');
    fileConfig = JSON.parse(content);
    console.log('Loaded existing config.json');
  } catch {
    console.warn('Config file not found, will create default config.json');
  }

  const merged = { ...base, ...fileConfig };

  try {
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(configPath, JSON.stringify(merged, null, 2));
  } catch (err) {
    console.error('Failed to write config.json:', err);
    process.exit(1);
  }

  return merged;
}

function normalizeFsPath(p: string): string {
  const baseDir = runningInProduction()
    ? dirname(process.execPath)
    : process.cwd();
  if (!p || p.trim().length === 0) {
    return resolve(baseDir);
  }
  if (p.startsWith('file:')) {
    try {
      return fileURLToPath(new URL(p));
    } catch {
      // Ignore
    }
  }
  return resolve(baseDir, p);
}

const raw = load();
const parsed = schema.safeParse(raw);
if (!parsed.success) {
  console.error('Invalid config:', parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  database_file: normalizeFsPath(parsed.data.database_file),
  whisper_models_dir: normalizeFsPath(parsed.data.whisper_models_dir),
  whisper_cache_dir: normalizeFsPath(parsed.data.whisper_cache_dir),
  images_dir: normalizeFsPath(parsed.data.images_dir),
  web_dist_dir: normalizeFsPath(parsed.data.web_dist_dir),
} as typeof parsed.data;

export const isProduction = (): boolean => runningInProduction();

export const ensureDirectoriesExist = (): void => {
  const directories: string[] = [
    dirname(config.database_file),
    config.whisper_models_dir,
    config.whisper_cache_dir,
    config.images_dir,
  ];
  const unique = Array.from(new Set(directories)).filter(
    (dir) => dir !== '.' && dir !== './'
  );
  for (const dir of unique) {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (err) {
      console.warn(`Failed to create directory ${dir}:`, err);
    }
  }
};

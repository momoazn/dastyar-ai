import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
loadEnv();

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
  CORS_ORIGIN: z.string().default('*'),

  DATABASE_FILE: z.string().default('./data.db'),

  WHISPER_MODELS_DIR: z.string().default('./whisper-models'),
  WHISPER_CACHE_DIR: z.string().default('./.whisper-cache'),
  WHISPER_WASM_DIR: z
    .string()
    .default(
      './node_modules/.bun/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist'
    ),
  WHISPER_MODELS: z.string().default('Xenova/whisper-tiny'),

  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_ENABLED: z.coerce.boolean().default(true),

  LMSTUDIO_BASE_URL: z.string().default('http://localhost:1234/v1'),
  LMSTUDIO_ENABLED: z.coerce.boolean().default(false),

  STABLE_DIFFUSION_URL: z.string().default('http://localhost:7860'),
  STABLE_DIFFUSION_ENABLED: z.coerce.boolean().default(true),

  IMAGES_DIR: z.string().default('./generated-images'),
  WEB_DIST_DIR: z.string().default('./web'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid config:', parsed.error.format());
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  cors_origin: parsed.data.CORS_ORIGIN,
  database_file: parsed.data.DATABASE_FILE,
  whisper_models_dir: parsed.data.WHISPER_MODELS_DIR,
  whisper_cache_dir: parsed.data.WHISPER_CACHE_DIR,
  whisper_wasm_dir: parsed.data.WHISPER_WASM_DIR,
  whisper_models: parsed.data.WHISPER_MODELS.split(',').map((s) => s.trim()),
  ollama_base_url: parsed.data.OLLAMA_BASE_URL,
  ollama_enabled: parsed.data.OLLAMA_ENABLED,
  lmstudio_base_url: parsed.data.LMSTUDIO_BASE_URL,
  lmstudio_enabled: parsed.data.LMSTUDIO_ENABLED,
  stable_diffusion_url: parsed.data.STABLE_DIFFUSION_URL,
  stable_diffusion_enabled: parsed.data.STABLE_DIFFUSION_ENABLED,
  images_dir: parsed.data.IMAGES_DIR,
  web_dist_dir: parsed.data.WEB_DIST_DIR,
};

export const isProduction = (): boolean => {
  const modulePath = fileURLToPath(import.meta.url);
  return modulePath.includes('$bunfs');
};

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

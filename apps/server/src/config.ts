import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("127.0.0.1"),
  CORS_ORIGIN: z.string().default("*"),

  JWT_SECRET: z
    .string()
    .default("your-super-secret-jwt-key-change-this-in-production"),
  JWT_EXPIRES_IN: z.number().default(24 * 60 * 60),

  DATABASE_FILE: z.string().default("./data.db"),

  WHISPER_MODELS_DIR: z.string().default("./whisper-models"),
  WHISPER_CACHE_DIR: z.string().default("./.whisper-cache"),
  WHISPER_WASM_DIR: z
    .string()
    .default(
      "./node_modules/.bun/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist"
    ),
  WHISPER_MODELS: z.string().default("Xenova/whisper-tiny"),

  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_ENABLED: z.coerce.boolean().default(true),

  LMSTUDIO_BASE_URL: z.string().default("http://localhost:1234/v1"),
  LMSTUDIO_ENABLED: z.coerce.boolean().default(false),

  STABLE_DIFFUSION_URL: z.string().default("http://localhost:7860"),
  STABLE_DIFFUSION_ENABLED: z.coerce.boolean().default(true),

  IMAGES_DIR: z.string().default("./generated-images"),
  WEB_DIST_DIR: z.string().default("./web"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid config:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

const parseList = (value: string): string[] =>
  value
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const computeWhisperModelIds = (): string[] => {
  const configured = parseList(env.WHISPER_MODELS);
  if (configured.length > 0) {
    return configured;
  }
  return ["Xenova/whisper-tiny"];
};

export const whisperModelIds = computeWhisperModelIds();
export const defaultWhisperModel = whisperModelIds[0];

export const isProduction = (): boolean => {
  const modulePath = fileURLToPath(import.meta.url);
  return modulePath.includes("$bunfs");
};

const serverRootDir = fileURLToPath(new URL("..", import.meta.url));

const getRuntimeBaseDir = (): string => {
  if (isProduction()) {
    const bunExec = typeof Bun !== "undefined" ? Bun.argv?.[0] : undefined;
    const execCandidate = bunExec ?? process.argv?.[0];
    if (execCandidate) {
      return dirname(execCandidate);
    }
  }
  return serverRootDir;
};

const resolveWebDistDir = (): string => {
  const configured = env.WEB_DIST_DIR;
  if (isAbsolute(configured)) {
    return configured;
  }
  return resolve(getRuntimeBaseDir(), configured);
};

export const webDistDir = resolveWebDistDir();

export const ensureDirectoriesExist = (): void => {
  const directories: string[] = [
    dirname(env.DATABASE_FILE),
    env.WHISPER_MODELS_DIR,
    env.WHISPER_CACHE_DIR,
    env.IMAGES_DIR,
  ];
  const unique = Array.from(new Set(directories)).filter(
    (dir) => dir !== "." && dir !== "./"
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

export const resolveConfiguredPath = (
  configuredPath: string,
  baseDir: string = getRuntimeBaseDir()
): string => {
  if (isAbsolute(configuredPath)) {
    return configuredPath;
  }
  return resolve(baseDir, configuredPath);
};

export const collectOfflineModelIds = (): string[] => [...whisperModelIds];

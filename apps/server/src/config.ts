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
  const normalized = modulePath.split("\\").join("/").toLowerCase();
  return normalized.includes("$bunfs") || normalized.includes("~bun");
};

const serverRootDir = fileURLToPath(new URL("..", import.meta.url));

const isVirtualBunPath = (candidate: string | undefined): boolean => {
  if (!candidate) {
    return false;
  }
  const normalized = candidate.split("\\").join("/").toLowerCase();
  return normalized.includes("~bun") || normalized.includes("$bunfs");
};

export const getRuntimeBaseDir = (): string => {
  let base = serverRootDir;

  if (isProduction()) {
    const bunExec = typeof Bun !== "undefined" ? Bun.argv?.[0] : undefined;
    const execCandidate = process.execPath ?? bunExec ?? process.argv?.[0];
    if (execCandidate && !isVirtualBunPath(execCandidate)) {
      base = dirname(execCandidate);
    }

    if (isVirtualBunPath(base)) {
      const cwd = process.cwd();
      console.warn(
        `[config] Executable directory resolved to virtual Bun path "${base}", using process.cwd() instead: "${cwd}"`
      );
      base = cwd;
    }
  } else if (isVirtualBunPath(base)) {
    const cwd = process.cwd();
    console.warn(
      `[config] Server root directory resolved inside virtual Bun path "${base}", using process.cwd() instead: "${cwd}"`
    );
    base = cwd;
  }

  console.log("[config] Runtime directory resolution:", {
    isProduction: isProduction(),
    serverRootDir,
    resolvedBaseDir: base,
    processExecPath: process.execPath,
    processCwd: process.cwd(),
  });

  return base;
};

const resolveWebDistDir = (baseDir: string): string => {
  const configured = env.WEB_DIST_DIR;
  if (isAbsolute(configured)) {
    return configured;
  }
  return resolve(baseDir, configured);
};

export const runtimeBaseDir = getRuntimeBaseDir();
export const webDistDir = resolveWebDistDir(runtimeBaseDir);

console.log("[config] SPA directory resolution:", {
  configuredWebDist: env.WEB_DIST_DIR,
  runtimeBaseDir,
  webDistDir,
});

export const ensureDirectoriesExist = (): void => {
  const directories: string[] = [
    dirname(resolveConfiguredPath(env.DATABASE_FILE)),
    resolveConfiguredPath(env.WHISPER_MODELS_DIR),
    resolveConfiguredPath(env.WHISPER_CACHE_DIR),
    resolveConfiguredPath(env.IMAGES_DIR),
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
  baseDir: string = runtimeBaseDir
): string => {
  if (isAbsolute(configuredPath)) {
    return configuredPath;
  }
  return resolve(baseDir, configuredPath);
};

export const collectOfflineModelIds = (): string[] => [...whisperModelIds];

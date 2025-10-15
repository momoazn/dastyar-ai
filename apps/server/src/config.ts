import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const CONFIG_FILE = "config.json";
const serverRootDir = fileURLToPath(new URL("..", import.meta.url));

const isVirtualBunPath = (p?: string): boolean => {
  if (!p) {
    return false;
  }
  const norm = p.split("\\").join("/").toLowerCase();
  return norm.includes("$bunfs") || norm.includes("~bun");
};

export const isProduction = (): boolean => {
  const normalized = fileURLToPath(import.meta.url)
    .split("\\")
    .join("/")
    .toLowerCase();
  return normalized.includes("$bunfs") || normalized.includes("~bun");
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
      base = process.cwd();
    }
  } else if (isVirtualBunPath(base)) {
    base = process.cwd();
  }
  return base;
};

const findConfigPath = (baseDir: string): string | undefined => {
  const candidates = [
    resolve(baseDir, CONFIG_FILE),
    resolve(serverRootDir, CONFIG_FILE),
  ];
  return candidates.find((p) => existsSync(p));
};

const loadJson = (p?: string): Record<string, unknown> => {
  if (!p) {
    console.warn("[config] No config.json found; using defaults");
    return {};
  }
  try {
    return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch (err) {
    console.error(`[config] Failed to read/parse ${p}:`, err);
    process.exit(1);
  }
};

const Schema = z.object({
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
  DOCUMENTS_DIR: z.string().default("./uploaded-documents"),
  EMBEDDING_MODEL: z.string().default("nomic-embed-text"),
  WEB_DIST_DIR: z.string().default("./web"),
});

type Env = z.infer<typeof Schema>;

const _runtimeBaseDir = getRuntimeBaseDir();
const configPath = findConfigPath(_runtimeBaseDir);
const parsed = Schema.safeParse(loadJson(configPath));
if (!parsed.success) {
  console.error("Invalid config:", parsed.error.format());
  process.exit(1);
}
export const env: Env = parsed.data;

const parseCSV = (value: string): string[] =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const whisper = parseCSV(env.WHISPER_MODELS);
export const whisperModelIds =
  whisper.length > 0 ? whisper : ["Xenova/whisper-tiny"];
export const defaultWhisperModel = whisperModelIds[0];

const resolveWebDistDir = (baseDir: string): string =>
  isAbsolute(env.WEB_DIST_DIR)
    ? env.WEB_DIST_DIR
    : resolve(baseDir, env.WEB_DIST_DIR);

export const webDistDir = resolveWebDistDir(_runtimeBaseDir);

export const resolveConfiguredPath = (
  p: string,
  baseDir: string = _runtimeBaseDir
): string => (isAbsolute(p) ? p : resolve(baseDir, p));

export const ensureDirectoriesExist = (): void => {
  const dirs = [
    dirname(resolveConfiguredPath(env.DATABASE_FILE)),
    resolveConfiguredPath(env.WHISPER_MODELS_DIR),
    resolveConfiguredPath(env.WHISPER_CACHE_DIR),
    resolveConfiguredPath(env.IMAGES_DIR),
    resolveConfiguredPath(env.DOCUMENTS_DIR),
  ];
  const unique = Array.from(new Set(dirs)).filter(
    (d) => d !== "." && d !== "./"
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

export const runtimeBaseDir = _runtimeBaseDir;
export const collectOfflineModelIds = (): string[] => [...whisperModelIds];

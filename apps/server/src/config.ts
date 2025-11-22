import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { logger } from "./lib/logger";

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
    logger.warn("No config.json found; using defaults", { path: p });
    return {};
  }
  try {
    return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch (err) {
    logger.error("Failed to read/parse config file", err, { path: p });
    // Ensure logs are flushed before exiting
    process.stdout.write("\n");
    process.stderr.write("\n");
    process.exit(1);
  }
};

const Schema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z
    .string()
    .transform((val) => {
      // If "*" is specified, return it as-is for allow-all
      // Safe to use "*" since frontend uses relative URLs (same origin in production)
      // and Vite proxy handles CORS in development mode
      if (val.trim() === "*") {
        return "*";
      }
      // Otherwise, return comma-separated list as array
      return val.split(",").map((o) => o.trim());
    })
    .default("*"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security")
    .default("your-super-secret-jwt-key-change-this-in-production"),
  JWT_EXPIRES_IN: z.number().default(24 * 60 * 60),
  DATABASE_FILE: z.string().default("./data.db"),
  // Optional external Whisper server (Go implementation) used for transcription
  WHISPER_SERVER_URL: z.string().default("http://127.0.0.1:8080"),
  // Timeout for requests to the Whisper server (ms)
  WHISPER_TIMEOUT_MS: z.coerce.number().default(120_000),
  WHISPER_MODELS: z.string().default("ggml-base.bin"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_ENABLED: z.coerce.boolean().default(true),
  LMSTUDIO_BASE_URL: z.string().default("http://localhost:1234/v1"),
  LMSTUDIO_ENABLED: z.coerce.boolean().default(true),
  GROQ_API_KEY: z.string().default(""),
  GROQ_ENABLED: z.coerce.boolean().default(false),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_ENABLED: z.coerce.boolean().default(false),
  STABLE_DIFFUSION_URL: z.string().default("http://localhost:7860"),
  STABLE_DIFFUSION_ENABLED: z.coerce.boolean().default(true),
  IMAGES_DIR: z.string().default("./generated-images"),
  DOCUMENTS_DIR: z.string().default("./uploaded-documents"),
  EMBEDDING_MODEL: z.string().default("nomic-embed-text"),
  WEB_DIST_DIR: z.string().default("./web"),
  // Rate limiting configuration
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_IP_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_IP_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_USER_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_USER_MAX_REQUESTS: z.coerce.number().default(500),
  RATE_LIMIT_CHAT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_CHAT_MAX_REQUESTS: z.coerce.number().default(300),
  RATE_LIMIT_IMAGES_WINDOW_MS: z.coerce.number().default(60 * 60 * 1000), // 1 hour
  RATE_LIMIT_IMAGES_MAX_REQUESTS: z.coerce.number().default(50),
  // SSL/TLS configuration
  SSL_ENABLED: z.coerce.boolean().default(false),
  SSL_CERT_PATH: z.string().default(""),
  SSL_KEY_PATH: z.string().default(""),
});

type Env = z.infer<typeof Schema>;

const _runtimeBaseDir = getRuntimeBaseDir();
const configPath = findConfigPath(_runtimeBaseDir);

const jsonConfig = loadJson(configPath);
const parsed = Schema.safeParse(jsonConfig);

if (!parsed.success) {
  logger.error("Invalid configuration", parsed.error);
  process.exit(1);
}

export const env: Env = parsed.data;
export const configFilePath = configPath;

/**
 * Validate secrets in production
 * Ensures that default/example secrets are not used in production
 */
export const validateProductionSecrets = (): void => {
  if (!isProduction()) {
    return;
  }

  const issues: string[] = [];

  // Check JWT_SECRET
  const UNSAFE_JWT_SECRETS = [
    "your-super-secret-jwt-key-change-this-in-production",
    "***REMOVED***",
  ];

  if (UNSAFE_JWT_SECRETS.includes(env.JWT_SECRET)) {
    issues.push(
      "JWT_SECRET is using a default/example value. Generate a new secret with: openssl rand -base64 48"
    );
  }

  // Check API keys if services are enabled
  if (env.GROQ_ENABLED && !env.GROQ_API_KEY) {
    issues.push("GROQ is enabled but GROQ_API_KEY is not set");
  }

  if (env.GEMINI_ENABLED && !env.GEMINI_API_KEY) {
    issues.push("GEMINI is enabled but GEMINI_API_KEY is not set");
  }

  // Check SSL configuration
  if (env.SSL_ENABLED) {
    if (!env.SSL_CERT_PATH) {
      issues.push("SSL is enabled but SSL_CERT_PATH is not set");
    }
    if (!env.SSL_KEY_PATH) {
      issues.push("SSL is enabled but SSL_KEY_PATH is not set");
    }
  }

  if (issues.length > 0) {
    logger.fatal("Production security configuration issues detected:", {
      issues,
    });
    console.error("\n❌ Production security configuration issues:");
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
    console.error("\nCRITICAL: Fix these issues before deploying!\n");
    process.exit(1);
  }
};

const parseCSV = (value: string): string[] =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const whisper = parseCSV(env.WHISPER_MODELS);
export const whisperModelIds = whisper.length > 0 ? whisper : ["ggml-base.bin"];

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
      }
    } catch (err) {
      logger.error("Failed to create directory", err, { directory: dir });
    }
  }
};

export const runtimeBaseDir = _runtimeBaseDir;

/**
 * Rate limiter configuration
 * Conditionally enabled based on RATE_LIMIT_ENABLED setting
 */
export const rateLimitConfig = {
  enabled: env.RATE_LIMIT_ENABLED,
  ip: {
    windowMs: env.RATE_LIMIT_IP_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_IP_MAX_REQUESTS,
  },
  user: {
    windowMs: env.RATE_LIMIT_USER_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_USER_MAX_REQUESTS,
  },
  chat: {
    windowMs: env.RATE_LIMIT_CHAT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_CHAT_MAX_REQUESTS,
  },
  images: {
    windowMs: env.RATE_LIMIT_IMAGES_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_IMAGES_MAX_REQUESTS,
  },
};

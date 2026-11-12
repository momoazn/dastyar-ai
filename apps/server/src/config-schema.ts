import { z } from "zod";

export const DEFAULT_CONFIG = {
  PORT: 3000,
  HOST: "0.0.0.0",
  CORS_ORIGIN: "*",
  JWT_SECRET: "your-super-secret-jwt-key-change-this-in-production",
  JWT_EXPIRES_IN: 24 * 60 * 60,
  DATABASE_FILE: "./data.db",
  WHISPER_SERVER_URL: "http://127.0.0.1:8080",
  WHISPER_MODEL_DIR: "./models",
  WHISPER_TIMEOUT_MS: 120_000,
  WHISPER_MODELS: "ggml-base.bin",
  WEB_DEV_PORT: 3001,
  OLLAMA_BASE_URL: "http://localhost:11434",
  OLLAMA_ENABLED: true,
  STABLE_DIFFUSION_BASE_URL: "http://localhost:7860",
  IMAGES_DIR: "./generated-images",
  DOCUMENTS_DIR: "./uploaded-documents",
  EMBEDDING_MODEL: "nomic-embed-text",
  WEB_DIST_DIR: "./web",
  SSL_ENABLED: false,
  SSL_CERT_PATH: "",
  SSL_KEY_PATH: "",
} as const;

export const CONFIG_KEYS = Object.keys(DEFAULT_CONFIG) as Array<
  keyof typeof DEFAULT_CONFIG
>;

const TRUE_FLAGS = new Set(["true", "1", "yes", "on"]);
const FALSE_FLAGS = new Set(["false", "0", "no", "off", ""]);

// `z.coerce.boolean()` turns the string "false" into true, because
// Boolean("false") is true. Read boolean-like strings by their meaning.
const booleanFlag = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (TRUE_FLAGS.has(normalized)) {
        return true;
      }
      if (FALSE_FLAGS.has(normalized)) {
        return false;
      }
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    return value;
  }, z.boolean().default(defaultValue));

export const CONFIG_SCHEMA = z.object({
  PORT: z.coerce.number().default(DEFAULT_CONFIG.PORT),
  HOST: z.string().default(DEFAULT_CONFIG.HOST),
  CORS_ORIGIN: z
    .string()
    .transform((val) => {
      if (val.trim() === "*") {
        return "*";
      }
      return val.split(",").map((o) => o.trim());
    })
    .default(DEFAULT_CONFIG.CORS_ORIGIN),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security")
    .default(DEFAULT_CONFIG.JWT_SECRET),
  JWT_EXPIRES_IN: z.number().default(DEFAULT_CONFIG.JWT_EXPIRES_IN),
  DATABASE_FILE: z.string().default(DEFAULT_CONFIG.DATABASE_FILE),
  WHISPER_SERVER_URL: z.string().default(DEFAULT_CONFIG.WHISPER_SERVER_URL),
  WHISPER_MODEL_DIR: z.string().default(DEFAULT_CONFIG.WHISPER_MODEL_DIR),
  WHISPER_TIMEOUT_MS: z.coerce
    .number()
    .default(DEFAULT_CONFIG.WHISPER_TIMEOUT_MS),
  WHISPER_MODELS: z.string().default(DEFAULT_CONFIG.WHISPER_MODELS),
  WEB_DEV_PORT: z.coerce.number().default(DEFAULT_CONFIG.WEB_DEV_PORT),
  OLLAMA_BASE_URL: z.string().default(DEFAULT_CONFIG.OLLAMA_BASE_URL),
  OLLAMA_ENABLED: booleanFlag(DEFAULT_CONFIG.OLLAMA_ENABLED),
  STABLE_DIFFUSION_BASE_URL: z
    .string()
    .default(DEFAULT_CONFIG.STABLE_DIFFUSION_BASE_URL),
  IMAGES_DIR: z.string().default(DEFAULT_CONFIG.IMAGES_DIR),
  DOCUMENTS_DIR: z.string().default(DEFAULT_CONFIG.DOCUMENTS_DIR),
  EMBEDDING_MODEL: z.string().default(DEFAULT_CONFIG.EMBEDDING_MODEL),
  WEB_DIST_DIR: z.string().default(DEFAULT_CONFIG.WEB_DIST_DIR),
  SSL_ENABLED: booleanFlag(DEFAULT_CONFIG.SSL_ENABLED),
  SSL_CERT_PATH: z.string().default(DEFAULT_CONFIG.SSL_CERT_PATH),
  SSL_KEY_PATH: z.string().default(DEFAULT_CONFIG.SSL_KEY_PATH),
});

export type RuntimeConfig = z.infer<typeof CONFIG_SCHEMA>;

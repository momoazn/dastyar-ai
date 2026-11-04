import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { CONFIG_KEYS, CONFIG_SCHEMA, DEFAULT_CONFIG } from "./config-schema";
import { logger } from "./lib/logger";
import type { ConfigMap } from "./types/config";

const CONFIG_FILE = "config.json";
const serverRootDir = fileURLToPath(new URL("..", import.meta.url));
const repoRootDir = resolve(serverRootDir, "../..");

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

const findConfigPath = (
  baseDir: string,
  productionMode: boolean
): string | undefined => {
  const candidates = productionMode
    ? [resolve(baseDir, CONFIG_FILE)]
    : [resolve(repoRootDir, CONFIG_FILE)];

  return candidates.find((p) => existsSync(p));
};

const failAndExit = (
  message: string,
  details?: Record<string, unknown>
): never => {
  const detailsText = details ? ` ${JSON.stringify(details)}` : "";
  process.stderr.write(`FATAL: ${message}${detailsText}\n`);
  logger.fatal(message, details);
  process.stdout.write("\n");
  process.stderr.write("\n");
  process.exit(1);
};

const loadJson = (
  p: string | undefined,
  productionMode: boolean
): ConfigMap => {
  if (!p) {
    if (productionMode) {
      failAndExit(
        "Production config is missing. Expected config.json next to the binary.",
        {
          expectedPath: resolve(getRuntimeBaseDir(), CONFIG_FILE),
        }
      );
    }
    logger.warn("No root config.json found; using defaults", { path: p });
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(p, "utf8")) as unknown;
    if (
      parsed === null ||
      Array.isArray(parsed) ||
      typeof parsed !== "object"
    ) {
      failAndExit("Config file must contain a JSON object", { path: p });
    }
    return parsed as ConfigMap;
  } catch (err) {
    return failAndExit("Failed to read/parse config file", {
      path: p,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const assertProductionConfigCompleteness = (rawConfig: ConfigMap): void => {
  const missingKeys = CONFIG_KEYS.filter((key) => !(key in rawConfig));
  if (missingKeys.length > 0) {
    failAndExit(
      "Production config must define every required key in config.json",
      {
        missingKeys,
      }
    );
  }
};

type Env = import("./config-schema").RuntimeConfig;

const runtimeIsProduction = isProduction();
const _runtimeBaseDir = getRuntimeBaseDir();
const configPath = findConfigPath(_runtimeBaseDir, runtimeIsProduction);

const jsonConfig = loadJson(configPath, runtimeIsProduction);
if (runtimeIsProduction) {
  assertProductionConfigCompleteness(jsonConfig);
}
const parsedConfig: Env = (() => {
  try {
    return CONFIG_SCHEMA.parse(jsonConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      return failAndExit("Invalid configuration", {
        path: configPath,
        error: error.flatten(),
      });
    }
    return failAndExit("Invalid configuration", {
      path: configPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }
})();

export const env: Env = parsedConfig;
export const configFilePath = configPath;

/** Config warnings that do not stop the server. */
export const findSslConfigWarnings = (
  config: Pick<Env, "SSL_ENABLED" | "SSL_CERT_PATH" | "SSL_KEY_PATH">
): string[] => {
  if (!config.SSL_ENABLED) {
    return [];
  }
  const warnings: string[] = [];
  if (!config.SSL_CERT_PATH) {
    warnings.push("SSL is enabled but SSL_CERT_PATH is not set");
  }
  if (!config.SSL_KEY_PATH) {
    warnings.push("SSL is enabled but SSL_KEY_PATH is not set");
  }
  return warnings;
};

/**
 * Replace the placeholder JWT_SECRET in a config file with a random one.
 * Returns the new secret.
 */
export const replacePlaceholderJwtSecret = (path: string): string => {
  const raw = JSON.parse(readFileSync(path, "utf8")) as ConfigMap;
  const secret = randomBytes(48).toString("base64url");
  raw.JWT_SECRET = secret;
  writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  return secret;
};

/**
 * Production startup checks. A release package ships the placeholder
 * JWT_SECRET, so the first start writes a random secret into config.json.
 * The server stops if it cannot save that secret. Development runs skip this.
 */
export const validateProductionSecrets = (): void => {
  if (!isProduction()) {
    return;
  }

  if (env.JWT_SECRET === DEFAULT_CONFIG.JWT_SECRET) {
    const path =
      configPath ??
      failAndExit("JWT_SECRET is the placeholder and config.json is missing");
    try {
      env.JWT_SECRET = replacePlaceholderJwtSecret(path);
      logger.info("Replaced placeholder JWT_SECRET with a random secret", {
        path,
      });
    } catch (err) {
      failAndExit(
        "JWT_SECRET is the placeholder and config.json could not be updated. Set a random secret (openssl rand -base64 48).",
        {
          path,
          error: err instanceof Error ? err.message : String(err),
        }
      );
    }
  }

  const warnings = findSslConfigWarnings(env);
  if (warnings.length > 0) {
    logger.warn("Production configuration warnings", { warnings });
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

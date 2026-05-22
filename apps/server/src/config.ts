import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { CONFIG_KEYS, CONFIG_SCHEMA } from "./config-schema";
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
    logger.warn("Production security configuration issues detected:", {
      issues,
    });
    process.stderr.write("\n⚠️  Production security warnings:\n");
    for (const issue of issues) {
      process.stderr.write(`   - ${issue}\n`);
    }
    process.stderr.write(
      "⚠️  Server will continue to start, but this should be fixed before deployment.\n\n"
    );
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

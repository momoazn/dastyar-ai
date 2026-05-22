#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONFIG_KEYS, CONFIG_SCHEMA, DEFAULT_CONFIG } from "../config-schema";

type Command = "generate" | "show" | "validate";

type CliOptions = {
  command: Command;
  configPath: string;
  force: boolean;
};

type JsonObject = Record<string, unknown>;

const DEFAULT_CONFIG_FILE = "config.json";

const writeOut = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const writeErr = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const printUsage = (): void => {
  writeOut("Config generator");
  writeOut("");
  writeOut("Usage:");
  writeOut("  bun run config:<command> -- [options]");
  writeOut("");
  writeOut("Commands:");
  writeOut(
    "  generate   Write config.json using app defaults as single source"
  );
  writeOut("  show       Print effective config as JSON");
  writeOut(
    "  validate   Validate config.json strictly (missing/unknown keys fail)"
  );
  writeOut("");
  writeOut("Options:");
  writeOut("  --path <path>     Config file path (default: ./config.json)");
  writeOut("  --path=<path>     Config file path (default: ./config.json)");
  writeOut(
    "  --force           Overwrite with defaults (ignore existing values)"
  );
};

const failAndExit = (message: string): never => {
  writeErr(`ERROR: ${message}`);
  process.exit(1);
};

const toResolvedPath = (pathArg?: string): string =>
  resolve(process.cwd(), pathArg ?? DEFAULT_CONFIG_FILE);

const parseArgs = (argv: string[]): CliOptions => {
  const [commandArg, ...rest] = argv;

  if (
    commandArg !== "generate" &&
    commandArg !== "show" &&
    commandArg !== "validate"
  ) {
    printUsage();
    process.exit(1);
  }

  let configPath = toResolvedPath();
  let force = false;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--path") {
      const value = rest[i + 1];
      if (!value) {
        failAndExit("Missing value after --path");
      }
      configPath = toResolvedPath(value);
      i += 1;
      continue;
    }

    if (arg.startsWith("--path=")) {
      const value = arg.slice("--path=".length);
      if (!value) {
        failAndExit("Missing value for --path");
      }
      configPath = toResolvedPath(value);
      continue;
    }

    failAndExit(`Unknown option: ${arg}`);
  }

  return {
    command: commandArg,
    configPath,
    force,
  };
};

const readConfigObject = (configPath: string): JsonObject => {
  if (!existsSync(configPath)) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    failAndExit(
      `Failed to parse JSON at ${configPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    failAndExit(`Config at ${configPath} must be a JSON object`);
  }

  return parsed as JsonObject;
};

const normalizeFromDefaults = (rawConfig: JsonObject): JsonObject => {
  const normalized: JsonObject = {};

  for (const key of CONFIG_KEYS) {
    if (key in rawConfig) {
      normalized[key] = rawConfig[key];
    } else {
      normalized[key] = DEFAULT_CONFIG[key];
    }
  }

  return normalized;
};

const getUnknownKeys = (rawConfig: JsonObject): string[] => {
  const knownKeys = new Set<string>(CONFIG_KEYS);
  return Object.keys(rawConfig).filter((key) => !knownKeys.has(key));
};

const getMissingKeys = (rawConfig: JsonObject): string[] =>
  CONFIG_KEYS.filter((key) => !(key in rawConfig));

const writeConfig = (configPath: string, config: JsonObject): void => {
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
};

const generateConfig = ({ configPath, force }: CliOptions): void => {
  const existingConfig = force ? {} : readConfigObject(configPath);
  const normalized = force
    ? { ...DEFAULT_CONFIG }
    : normalizeFromDefaults(existingConfig);
  const parsed = CONFIG_SCHEMA.safeParse(normalized);

  if (!parsed.success) {
    failAndExit(
      `Generated config is invalid: ${JSON.stringify(parsed.error.flatten(), null, 2)}`
    );
  }

  writeConfig(configPath, normalized);
  writeOut(`Config written: ${configPath}`);

  if (!force && existsSync(configPath)) {
    const removedKeys = getUnknownKeys(existingConfig);
    if (removedKeys.length > 0) {
      writeOut(`Removed unknown keys: ${removedKeys.join(", ")}`);
    }
  }
};

const showConfig = ({ configPath }: CliOptions): void => {
  const rawConfig = readConfigObject(configPath);
  const normalized = normalizeFromDefaults(rawConfig);
  const parsed = CONFIG_SCHEMA.safeParse(normalized);

  if (!parsed.success) {
    failAndExit(
      `Config is invalid: ${JSON.stringify(parsed.error.flatten(), null, 2)}`
    );
  }

  writeOut(JSON.stringify(parsed.data, null, 2));
};

const validateConfig = ({ configPath }: CliOptions): void => {
  if (!existsSync(configPath)) {
    failAndExit(`Config file not found: ${configPath}`);
  }

  const rawConfig = readConfigObject(configPath);
  const missingKeys = getMissingKeys(rawConfig);
  const unknownKeys = getUnknownKeys(rawConfig);

  if (missingKeys.length > 0) {
    failAndExit(`Missing keys: ${missingKeys.join(", ")}`);
  }

  if (unknownKeys.length > 0) {
    failAndExit(`Unknown keys: ${unknownKeys.join(", ")}`);
  }

  const parsed = CONFIG_SCHEMA.safeParse(rawConfig);
  if (!parsed.success) {
    failAndExit(
      `Invalid config values: ${JSON.stringify(parsed.error.flatten(), null, 2)}`
    );
  }

  writeOut(`Config is valid: ${configPath}`);
};

const run = (options: CliOptions): void => {
  if (options.command === "generate") {
    generateConfig(options);
    return;
  }

  if (options.command === "show") {
    showConfig(options);
    return;
  }

  validateConfig(options);
};

if (import.meta.main) {
  const options = parseArgs(process.argv.slice(2));
  run(options);
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../apps/server/src/config-schema";
import { REPO_ROOT } from "./project-paths";

type AppConfig = typeof DEFAULT_CONFIG;

export function loadRootConfig(): AppConfig {
  const configPath = join(REPO_ROOT, "config.json");
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  const raw = JSON.parse(
    readFileSync(configPath, "utf8")
  ) as Partial<AppConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...raw,
  };
}

export function serverUrl(config = loadRootConfig()): string {
  return `http://localhost:${config.PORT}`;
}

export function whisperUrl(config = loadRootConfig()): string {
  return config.WHISPER_SERVER_URL;
}

export function portFromUrl(url: string): number {
  const parsed = new URL(url);
  if (parsed.port) {
    return Number(parsed.port);
  }
  return parsed.protocol === "https:" ? 443 : 80;
}

import { createOllama } from "ollama-ai-provider-v2";
import OpenAI from "openai";
import { env } from "@/config";
import { logger } from "@/lib/logger";
import {
  listKnownEnabledOllamaModels,
  listOllamaServers,
  replaceOllamaServerModels,
} from "@/repositories/ollama-servers";

const OLLAMA_TIMEOUT_MS = 5000;
const TRAILING_SLASH_RE = /\/+$/u;
const V1_SUFFIX_RE = /\/v1$/u;
const API_SUFFIX_RE = /\/api$/u;

const openAiClientsByBaseUrl = new Map<string, OpenAI>();
const providersByBaseUrl = new Map<string, ReturnType<typeof createOllama>>();

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl
    .trim()
    .replace(TRAILING_SLASH_RE, "")
    .replace(V1_SUFFIX_RE, "")
    .replace(API_SUFFIX_RE, "");

const toV1BaseUrl = (baseUrl: string): string =>
  `${normalizeBaseUrl(baseUrl)}/v1`;
const toApiBaseUrl = (baseUrl: string): string =>
  `${normalizeBaseUrl(baseUrl)}/api/`;

const getOpenAiClient = (baseUrl: string): OpenAI => {
  const normalized = normalizeBaseUrl(baseUrl);
  const cached = openAiClientsByBaseUrl.get(normalized);
  if (cached) {
    return cached;
  }

  const client = new OpenAI({
    baseURL: toV1BaseUrl(normalized),
    apiKey: "",
    timeout: OLLAMA_TIMEOUT_MS,
  });
  openAiClientsByBaseUrl.set(normalized, client);
  return client;
};

const getOllamaProvider = (
  baseUrl: string
): ReturnType<typeof createOllama> => {
  const normalized = normalizeBaseUrl(baseUrl);
  const cached = providersByBaseUrl.get(normalized);
  if (cached) {
    return cached;
  }

  const provider = createOllama({
    baseURL: toApiBaseUrl(normalized),
  });
  providersByBaseUrl.set(normalized, provider);
  return provider;
};

export const ollamaProvider = getOllamaProvider(env.OLLAMA_BASE_URL);
export const ollamaClient = getOpenAiClient(env.OLLAMA_BASE_URL);

export function getOllamaProviderForBaseUrl(baseUrl: string) {
  return getOllamaProvider(baseUrl);
}

export async function listOllamaModelsForBaseUrl(baseUrl: string) {
  const client = getOpenAiClient(baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await client.models.list({
      signal: controller.signal as AbortSignal,
    });
    return response.data.map((model) => model.id);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function listOllamaModels() {
  if (!env.OLLAMA_ENABLED) {
    return [];
  }

  const servers = await listOllamaServers({
    includeDisabled: false,
    ensureDefault: true,
  });

  const result = await Promise.all(
    servers.map(async (server) => {
      try {
        const models = await listOllamaModelsForBaseUrl(server.baseUrl);
        await replaceOllamaServerModels(server.id, models);
        return models.map((name) => ({
          name,
          provider: "ollama" as const,
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Connection failed";
        logger.error("Ollama provider not available", error, {
          baseURL: server.baseUrl,
          message,
          serverId: server.id,
        });
        await replaceOllamaServerModels(server.id, []);
        return [];
      }
    })
  );

  const flattened = result.flat();
  if (flattened.length > 0) {
    return flattened;
  }

  // Fallback to previously known mappings if all live probes fail.
  const knownModels = await listKnownEnabledOllamaModels();
  return knownModels.map((name) => ({
    name,
    provider: "ollama" as const,
  }));
}

export async function syncOllamaModelsForServer(server: {
  id: number;
  baseUrl: string;
}) {
  const models = await listOllamaModelsForBaseUrl(server.baseUrl);
  await replaceOllamaServerModels(server.id, models);

  return models.map((name) => ({
    name,
    provider: "ollama" as const,
  }));
}

export async function syncAllOllamaServerModels() {
  const servers = await listOllamaServers({
    includeDisabled: false,
    ensureDefault: true,
  });

  const allModels = await Promise.all(
    servers.map(async (server) => {
      try {
        return await syncOllamaModelsForServer(server);
      } catch (error) {
        logger.error("Failed syncing Ollama models for server", error, {
          serverId: server.id,
          baseURL: server.baseUrl,
        });
        await replaceOllamaServerModels(server.id, []);
        return [];
      }
    })
  );

  return allModels.flat();
}

export async function testOllamaServerConnection(baseUrl: string) {
  try {
    await listOllamaModelsForBaseUrl(baseUrl);
    return { ok: true as const, error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    return { ok: false as const, error: message };
  }
}

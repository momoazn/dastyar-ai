import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { LLMModelProvider } from "@/database";
import { listLmstudioModels, lmstudioProvider } from "./lmstudio-provider";
import {
  getOllamaProviderForBaseUrl,
  listOllamaModels,
  syncAllOllamaServerModels,
} from "./ollama-provider";
import { acquireLeastBusyOllamaServerForModel } from "./ollama-router";

// Providers that serve chat/text models. Stable Diffusion and Whisper models
// have their own services and cannot be used for text generation.
const textProviders: Partial<
  Record<LLMModelProvider, (name: string) => LanguageModelV2>
> = {
  lmstudio: lmstudioProvider,
};

const modelListers = [listOllamaModels, listLmstudioModels] as const;

export async function listAllModels(): Promise<
  { name: string; provider: LLMModelProvider }[]
> {
  return (
    await Promise.all(modelListers.map((listModels) => listModels()))
  ).flat();
}

export type ProviderLease = {
  model: LanguageModelV2;
  release: () => void;
  route?: {
    serverId: number;
    serverName: string;
    baseUrl: string;
    busyScore: number;
    inFlight: number;
    runningModels: number;
    reachable: boolean;
  };
};

const noOpRelease = () => {
  // no-op for providers that do not require load-tracking leases
};

export async function acquireProviderForModel(
  name: string,
  provider: LLMModelProvider = "ollama"
): Promise<ProviderLease> {
  if (provider !== "ollama") {
    const createModel = textProviders[provider];
    if (!createModel) {
      throw new Error(`Provider "${provider}" does not serve text models`);
    }
    return { model: createModel(name), release: noOpRelease };
  }

  const lease = await acquireLeastBusyOllamaServerForModel(name).catch(
    async () => {
      // Model mappings may be stale. Refresh once and retry selection.
      await syncAllOllamaServerModels();
      return await acquireLeastBusyOllamaServerForModel(name);
    }
  );
  const providerForServer = getOllamaProviderForBaseUrl(lease.server.baseUrl);

  return {
    model: providerForServer(name),
    release: lease.release,
    route: {
      serverId: lease.server.id,
      serverName: lease.server.name,
      baseUrl: lease.server.baseUrl,
      busyScore: lease.metrics.busyScore,
      inFlight: lease.metrics.inFlight,
      runningModels: lease.metrics.runningModels,
      reachable: lease.metrics.reachable,
    },
  };
}

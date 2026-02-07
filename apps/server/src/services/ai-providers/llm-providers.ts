import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { LLMModelProvider } from "@/database";
import { listLmstudioModels, lmstudioProvider } from "./lmstudio-provider";
import {
  getOllamaProviderForBaseUrl,
  listOllamaModels,
  ollamaProvider,
  syncAllOllamaServerModels,
} from "./ollama-provider";
import { acquireLeastBusyOllamaServerForModel } from "./ollama-router";

const providerToModel = {
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
  "stable-diffusion": ollamaProvider, // Using ollama provider as fallback for stable-diffusion
  whisper: ollamaProvider, // Using ollama provider as fallback for whisper
} as const;

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
    return {
      model: providerToModel[provider](name),
      release: noOpRelease,
    };
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

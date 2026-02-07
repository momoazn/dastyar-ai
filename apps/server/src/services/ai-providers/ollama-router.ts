import type { OllamaServer } from "@/database";
import { getEnabledOllamaServersForModel } from "@/repositories/ollama-servers";

export type RuntimeState = {
  inFlight: number;
  ewmaLatencyMs: number;
};

export type PsLoad = {
  runningModels: number;
  reachable: boolean;
};

type PsCacheEntry = {
  at: number;
  load: PsLoad;
};

const runtimeByServerId = new Map<number, RuntimeState>();
const psCacheByServerId = new Map<number, PsCacheEntry>();

const PS_CACHE_TTL_MS = 1500;
const PS_TIMEOUT_MS = 2500;
const EWMA_ALPHA = 0.2;

const getRuntimeState = (serverId: number): RuntimeState => {
  const current = runtimeByServerId.get(serverId);
  if (current) {
    return current;
  }

  const initial: RuntimeState = {
    inFlight: 0,
    ewmaLatencyMs: 0,
  };
  runtimeByServerId.set(serverId, initial);
  return initial;
};

const parseRunningModels = (payload: unknown): number => {
  if (!(payload && typeof payload === "object")) {
    return 0;
  }

  const models = (payload as { models?: unknown }).models;
  if (Array.isArray(models)) {
    return models.length;
  }

  return 0;
};

const fetchPsLoad = async (server: OllamaServer): Promise<PsLoad> => {
  const cached = psCacheByServerId.get(server.id);
  const now = Date.now();
  if (cached && now - cached.at < PS_CACHE_TTL_MS) {
    return cached.load;
  }

  try {
    const response = await fetch(`${server.baseUrl}/api/ps`, {
      signal: AbortSignal.timeout(PS_TIMEOUT_MS),
    });

    if (!response.ok) {
      const load = { runningModels: 0, reachable: false };
      psCacheByServerId.set(server.id, { at: now, load });
      return load;
    }

    const payload = (await response.json()) as unknown;
    const load = {
      runningModels: parseRunningModels(payload),
      reachable: true,
    };
    psCacheByServerId.set(server.id, { at: now, load });
    return load;
  } catch {
    const load = { runningModels: 0, reachable: false };
    psCacheByServerId.set(server.id, { at: now, load });
    return load;
  }
};

export const computeOllamaBusyScore = (
  state: RuntimeState,
  load: PsLoad
): number => {
  const inFlightScore = state.inFlight * 10;
  const runningScore = load.runningModels * 3;
  const latencyScore = state.ewmaLatencyMs / 500;
  const unreachablePenalty = load.reachable ? 0 : 10;

  return inFlightScore + runningScore + latencyScore + unreachablePenalty;
};

export type OllamaServerCandidate = {
  server: OllamaServer;
  load: PsLoad;
  state: RuntimeState;
};

export function pickLeastBusyOllamaServer(
  candidates: OllamaServerCandidate[]
): OllamaServerCandidate {
  if (candidates.length === 0) {
    throw new Error("Cannot pick server from empty candidates");
  }

  const sorted = [...candidates].sort((a, b) => {
    const scoreA = computeOllamaBusyScore(a.state, a.load);
    const scoreB = computeOllamaBusyScore(b.state, b.load);
    if (scoreA === scoreB) {
      return a.server.id - b.server.id;
    }
    return scoreA - scoreB;
  });

  return sorted[0];
}

const updateLatency = (serverId: number, durationMs: number): void => {
  const state = getRuntimeState(serverId);
  if (state.ewmaLatencyMs <= 0) {
    state.ewmaLatencyMs = durationMs;
    return;
  }

  state.ewmaLatencyMs =
    state.ewmaLatencyMs * (1 - EWMA_ALPHA) + durationMs * EWMA_ALPHA;
};

export type OllamaRouteLease = {
  release: () => void;
  server: OllamaServer;
  metrics: {
    busyScore: number;
    inFlight: number;
    runningModels: number;
    reachable: boolean;
  };
};

export async function acquireLeastBusyOllamaServerForModel(
  modelIdentifier: string
): Promise<OllamaRouteLease> {
  const candidates = await getEnabledOllamaServersForModel(modelIdentifier);
  if (candidates.length === 0) {
    throw new Error(`No enabled Ollama server has model '${modelIdentifier}'`);
  }

  const scored = await Promise.all(
    candidates.map(async (server) => {
      const state = getRuntimeState(server.id);
      const load = await fetchPsLoad(server);
      return {
        server,
        load,
        state,
        busyScore: computeOllamaBusyScore(state, load),
      };
    })
  );

  const selected = pickLeastBusyOllamaServer(scored);
  selected.state.inFlight += 1;

  const startedAt = Date.now();
  let released = false;

  return {
    server: selected.server,
    metrics: {
      busyScore: computeOllamaBusyScore(selected.state, selected.load),
      inFlight: selected.state.inFlight,
      runningModels: selected.load.runningModels,
      reachable: selected.load.reachable,
    },
    release: () => {
      if (released) {
        return;
      }
      released = true;

      const state = getRuntimeState(selected.server.id);
      state.inFlight = Math.max(0, state.inFlight - 1);
      updateLatency(selected.server.id, Date.now() - startedAt);
    },
  };
}

export async function getOllamaServerRuntimeMetrics(servers: OllamaServer[]) {
  const metrics = await Promise.all(
    servers.map(async (server) => {
      const state = getRuntimeState(server.id);
      const load = await fetchPsLoad(server);
      return {
        serverId: server.id,
        inFlight: state.inFlight,
        runningModels: load.runningModels,
        reachable: load.reachable,
        busyScore: computeOllamaBusyScore(state, load),
        ewmaLatencyMs: Math.round(state.ewmaLatencyMs),
      };
    })
  );

  return metrics;
}

export function clearOllamaRouterRuntimeState(): void {
  runtimeByServerId.clear();
  psCacheByServerId.clear();
}

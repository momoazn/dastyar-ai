import { describe, expect, it } from "bun:test";
import type { OllamaServer } from "@/database";
import {
  computeOllamaBusyScore,
  pickLeastBusyOllamaServer,
} from "./ollama-router";

const server = (id: number): OllamaServer => ({
  id,
  name: `server-${id}`,
  baseUrl: `http://localhost:${11_430 + id}`,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("computeOllamaBusyScore", () => {
  it("increases with in-flight, running models, and latency", () => {
    const low = computeOllamaBusyScore(
      { inFlight: 0, ewmaLatencyMs: 200 },
      { runningModels: 0, reachable: true }
    );

    const high = computeOllamaBusyScore(
      { inFlight: 2, ewmaLatencyMs: 800 },
      { runningModels: 3, reachable: true }
    );

    expect(high).toBeGreaterThan(low);
  });

  it("applies penalty when server is unreachable", () => {
    const reachable = computeOllamaBusyScore(
      { inFlight: 0, ewmaLatencyMs: 0 },
      { runningModels: 1, reachable: true }
    );

    const unreachable = computeOllamaBusyScore(
      { inFlight: 0, ewmaLatencyMs: 0 },
      { runningModels: 1, reachable: false }
    );

    expect(unreachable).toBeGreaterThan(reachable);
  });
});

describe("pickLeastBusyOllamaServer", () => {
  it("picks server with the lowest score", () => {
    const selected = pickLeastBusyOllamaServer([
      {
        server: server(1),
        state: { inFlight: 2, ewmaLatencyMs: 1200 },
        load: { runningModels: 2, reachable: true },
      },
      {
        server: server(2),
        state: { inFlight: 0, ewmaLatencyMs: 120 },
        load: { runningModels: 1, reachable: true },
      },
    ]);

    expect(selected.server.id).toBe(2);
  });

  it("uses lower server id as tie-breaker", () => {
    const selected = pickLeastBusyOllamaServer([
      {
        server: server(10),
        state: { inFlight: 0, ewmaLatencyMs: 500 },
        load: { runningModels: 0, reachable: true },
      },
      {
        server: server(3),
        state: { inFlight: 0, ewmaLatencyMs: 500 },
        load: { runningModels: 0, reachable: true },
      },
    ]);

    expect(selected.server.id).toBe(3);
  });
});

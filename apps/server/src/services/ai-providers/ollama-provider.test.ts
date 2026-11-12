import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { db, initializeDatabase, ollamaServers } from "@/database";
import {
  createOllamaServer,
  listOllamaServerModelIdentifiers,
  replaceOllamaServerModels,
} from "@/repositories/ollama-servers";
import { listOllamaModels, syncAllOllamaServerModels } from "./ollama-provider";

// Port 1 refuses connections immediately, so a probe fails without a delay.
const UNREACHABLE_BASE_URL = "http://127.0.0.1:1";

describe("Ollama model sync with an unreachable server", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(ollamaServers);
  });

  it("keeps the known model mappings when a live probe fails", async () => {
    const server = await createOllamaServer({
      name: "offline",
      baseUrl: UNREACHABLE_BASE_URL,
    });
    await replaceOllamaServerModels(server.id, ["llama3:8b"]);

    const discovered = await syncAllOllamaServerModels();

    expect(discovered).toEqual([]);
    expect(await listOllamaServerModelIdentifiers(server.id)).toEqual([
      "llama3:8b",
    ]);
  });

  it("falls back to the known models when every server is unreachable", async () => {
    const server = await createOllamaServer({
      name: "offline",
      baseUrl: UNREACHABLE_BASE_URL,
    });
    await replaceOllamaServerModels(server.id, ["llama3:8b"]);

    expect(await listOllamaModels()).toEqual([
      { name: "llama3:8b", provider: "ollama" },
    ]);
  });
});

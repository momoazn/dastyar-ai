import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { db, initializeDatabase, ollamaServers } from "@/database";
import {
  createOllamaServer,
  listOllamaServerModelIdentifiers,
  replaceOllamaServerModels,
} from "./ollama-servers";

describe("replaceOllamaServerModels", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(ollamaServers);
  });

  it("replaces the model list and drops duplicates", async () => {
    const server = await createOllamaServer({
      name: "s1",
      baseUrl: "http://localhost:11434/",
    });
    await replaceOllamaServerModels(server.id, ["a", "b", "a"]);
    await replaceOllamaServerModels(server.id, ["b", "c"]);
    const ids = await listOllamaServerModelIdentifiers(server.id);
    expect(ids.sort()).toEqual(["b", "c"]);
  });
});

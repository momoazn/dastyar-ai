import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  db,
  initializeDatabase,
  llmModels,
  summaries,
  users,
} from "@/database";
import { createUser, hashPassword } from "./auth";
import { getModels, syncModels } from "./llm-models";
import { createSummary } from "./summaries";

describe("syncModels", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(summaries);
    await db.delete(users);
    await db.delete(llmModels);
  });

  it("does not insert a model twice when syncs run in parallel", async () => {
    const list = [{ name: "llama3:8b", provider: "ollama" as const }];
    await Promise.all([syncModels(list), syncModels(list), syncModels(list)]);
    expect(await getModels({ identifier: "llama3:8b" })).toHaveLength(1);
  });

  it("keeps rows that use a duplicate model when it is pruned", async () => {
    const [keep, dup] = await db
      .insert(llmModels)
      .values([
        { identifier: "m1", provider: "ollama" },
        { identifier: "m1", provider: "ollama" },
      ])
      .returning();
    const user = await createUser({
      username: "1234567890",
      password: await hashPassword("password123"),
      role: "user",
    });
    const summary = await createSummary({
      sourceText: "a",
      summaryText: "b",
      mode: "standard",
      tone: "professional",
      modelId: dup.id,
      userId: user.id,
    });

    await syncModels([]);

    const rows = await db.select().from(summaries);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(summary.id);
    expect(rows[0].modelId).toBe(keep.id);
    expect(await getModels({ identifier: "m1" })).toHaveLength(1);
  });
});

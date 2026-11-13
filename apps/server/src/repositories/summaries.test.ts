import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  db,
  initializeDatabase,
  llmModels,
  summaries,
  users,
} from "@/database";
import { createUser, hashPassword } from "./auth";
import {
  createSummary,
  deleteSummary,
  getSummary,
  listSummaries,
} from "./summaries";

async function cleanupTables() {
  await db.delete(summaries);
  await db.delete(llmModels);
  await db.delete(users);
}

async function createTestUser(username: string) {
  const password = await hashPassword("password123");
  return await createUser({
    username,
    password,
    role: "user",
  });
}

async function createTestModel() {
  const [model] = await db
    .insert(llmModels)
    .values({
      identifier: "test-summary-model:7b",
      provider: "ollama",
    })
    .returning();
  return model;
}

describe("Summaries Repository", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await cleanupTables();
  });

  it("lists summaries ordered by newest first", async () => {
    const user = await createTestUser("2000000001");
    const model = await createTestModel();

    const first = await createSummary({
      sourceText: "First text to summarize",
      summaryText: "First summary",
      mode: "standard",
      tone: "formal",
      modelId: model.id,
      userId: user.id,
    });

    const second = await createSummary({
      sourceText: "Second text to summarize",
      summaryText: "Second summary",
      mode: "concise",
      tone: "informal",
      modelId: model.id,
      userId: user.id,
    });

    const list = await listSummaries(user.id);
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe(second.id);
    expect(list[1]?.id).toBe(first.id);
  });

  it("does not return summaries of other users", async () => {
    const userA = await createTestUser("2000000002");
    const userB = await createTestUser("2000000003");
    const model = await createTestModel();

    await createSummary({
      sourceText: "User A text",
      summaryText: "User A summary",
      mode: "standard",
      tone: "formal",
      modelId: model.id,
      userId: userA.id,
    });

    await createSummary({
      sourceText: "User B text",
      summaryText: "User B summary",
      mode: "standard",
      tone: "formal",
      modelId: model.id,
      userId: userB.id,
    });

    const listA = await listSummaries(userA.id);
    expect(listA).toHaveLength(1);
    expect(listA[0]?.sourceText).toBe("User A text");

    const listB = await listSummaries(userB.id);
    expect(listB).toHaveLength(1);
    expect(listB[0]?.sourceText).toBe("User B text");
  });

  it("does not allow user to get or delete another user's summary", async () => {
    const userA = await createTestUser("2000000004");
    const userB = await createTestUser("2000000005");
    const model = await createTestModel();

    const createdB = await createSummary({
      sourceText: "Secret summary source",
      summaryText: "Secret summary result",
      mode: "standard",
      tone: "formal",
      modelId: model.id,
      userId: userB.id,
    });

    // User A cannot get User B's summary
    const readByA = await getSummary(createdB.id, userA.id);
    expect(readByA).toBeNull();

    // User A cannot delete User B's summary
    await deleteSummary(createdB.id, userA.id);

    const readByB = await getSummary(createdB.id, userB.id);
    expect(readByB).not.toBeNull();
    expect(readByB?.id).toBe(createdB.id);

    // User B can delete own summary
    await deleteSummary(createdB.id, userB.id);
    const readAfterDelete = await getSummary(createdB.id, userB.id);
    expect(readAfterDelete).toBeNull();
  });
});

import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  db,
  initializeDatabase,
  llmModels,
  translations,
  users,
} from "@/database";
import { createUser, hashPassword } from "./auth";
import {
  createTranslation,
  deleteTranslation,
  getTranslation,
  listTranslations,
} from "./translations";

async function cleanupTables() {
  await db.delete(translations);
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
      identifier: "test-model:7b",
      provider: "ollama",
    })
    .returning();
  return model;
}

describe("Translations Repository", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await cleanupTables();
  });

  it("lists translations ordered by createdAt descending", async () => {
    const user = await createTestUser("1000000001");
    const model = await createTestModel();

    const first = await createTranslation({
      sourceText: "Hello",
      translatedText: "سلام",
      sourceLanguage: "en",
      targetLanguage: "fa",
      tone: "formal",
      modelId: model.id,
      userId: user.id,
    });

    // Small delay to ensure timestamp difference
    await Bun.sleep(10);

    const second = await createTranslation({
      sourceText: "Good morning",
      translatedText: "صبح بخیر",
      sourceLanguage: "en",
      targetLanguage: "fa",
      tone: "formal",
      modelId: model.id,
      userId: user.id,
    });

    const list = await listTranslations(user.id);
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe(second.id);
    expect(list[1]?.id).toBe(first.id);
  });

  it("does not return translations of other users", async () => {
    const userA = await createTestUser("1000000002");
    const userB = await createTestUser("1000000003");
    const model = await createTestModel();

    await createTranslation({
      sourceText: "Private text A",
      translatedText: "متن خصوصی الف",
      sourceLanguage: "en",
      targetLanguage: "fa",
      modelId: model.id,
      userId: userA.id,
    });

    await createTranslation({
      sourceText: "Private text B",
      translatedText: "متن خصوصی ب",
      sourceLanguage: "en",
      targetLanguage: "fa",
      modelId: model.id,
      userId: userB.id,
    });

    const userAList = await listTranslations(userA.id);
    expect(userAList).toHaveLength(1);
    expect(userAList[0]?.sourceText).toBe("Private text A");

    const userBList = await listTranslations(userB.id);
    expect(userBList).toHaveLength(1);
    expect(userBList[0]?.sourceText).toBe("Private text B");
  });

  it("does not allow user to get or delete another user's translation", async () => {
    const userA = await createTestUser("1000000004");
    const userB = await createTestUser("1000000005");
    const model = await createTestModel();

    const createdB = await createTranslation({
      sourceText: "Secret text B",
      translatedText: "متن محرمانه ب",
      sourceLanguage: "en",
      targetLanguage: "fa",
      modelId: model.id,
      userId: userB.id,
    });

    // User A cannot get User B's translation
    const readByA = await getTranslation(createdB.id, userA.id);
    expect(readByA).toBeNull();

    // User A cannot delete User B's translation
    await deleteTranslation(createdB.id, userA.id);

    const readByB = await getTranslation(createdB.id, userB.id);
    expect(readByB).not.toBeNull();
    expect(readByB?.id).toBe(createdB.id);

    // User B can delete own translation
    await deleteTranslation(createdB.id, userB.id);
    const readAfterDelete = await getTranslation(createdB.id, userB.id);
    expect(readAfterDelete).toBeNull();
  });
});

import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  chatThreads,
  db,
  initializeDatabase,
  llmModels,
  messages,
  users,
} from "@/database";
import { createUser, hashPassword } from "./auth";
import {
  clearThread,
  createMessage,
  getLastUsedModelGlobal,
  getLastUsedModelInThread,
} from "./messages";
import { createThread, getThread, updateThreadOnNewMessage } from "./threads";

describe("messages repository regression tests", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(messages);
    await db.delete(chatThreads);
    await db.delete(llmModels);
    await db.delete(users);
  });

  it("clearThread resets lastMessageAt in chatThreads to null", async () => {
    const user = await createUser({
      username: "8000000001",
      password: await hashPassword("password123"),
      role: "user",
    });

    const thread = await createThread({ userId: user.id });

    const [model] = await db
      .insert(llmModels)
      .values({
        identifier: "test-model-1",
        provider: "ollama",
        isEnabled: true,
      })
      .returning();

    await createMessage({
      threadId: thread.id,
      userId: user.id,
      modelId: model.id,
      role: "user",
      status: "finished",
      parts: [{ type: "text", text: "hello" }],
    });
    await updateThreadOnNewMessage(thread.id, user.id, new Date());

    const beforeClear = await getThread(thread.id, user.id);
    expect(beforeClear?.lastMessageAt).not.toBeNull();

    await clearThread(thread.id, user.id);

    const afterClear = await getThread(thread.id, user.id);
    expect(afterClear?.lastMessageAt).toBeNull();
  });

  it("getLastUsedModelInThread and getLastUsedModelGlobal skip disabled models", async () => {
    const user = await createUser({
      username: "8000000002",
      password: await hashPassword("password123"),
      role: "user",
    });

    const thread = await createThread({ userId: user.id });

    // Insert an active model and a disabled model
    const [enabledModel] = await db
      .insert(llmModels)
      .values({
        identifier: "enabled-model",
        provider: "ollama",
        isEnabled: true,
      })
      .returning();

    const [disabledModel] = await db
      .insert(llmModels)
      .values({
        identifier: "disabled-model",
        provider: "ollama",
        isEnabled: false,
      })
      .returning();

    // Message 1 with enabled model (older)
    const oldDate = new Date(Date.now() - 30_000);
    await db
      .insert(messages)
      .values({
        threadId: thread.id,
        userId: user.id,
        modelId: enabledModel.id,
        role: "user",
        status: "finished",
        parts: [{ type: "text", text: "m1" }],
        createdAt: oldDate,
        updatedAt: oldDate,
      })
      .returning();

    // Message 2 with disabled model (newer)
    await db
      .insert(messages)
      .values({
        threadId: thread.id,
        userId: user.id,
        modelId: disabledModel.id,
        role: "user",
        status: "finished",
        parts: [{ type: "text", text: "m2" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Both functions must ignore the newer disabled model and return the active one
    const threadModel = await getLastUsedModelInThread(thread.id, user.id);
    expect(threadModel).not.toBeNull();
    expect(threadModel?.id).toBe(enabledModel.id);
    expect(threadModel?.identifier).toBe("enabled-model");

    const globalModel = await getLastUsedModelGlobal(user.id);
    expect(globalModel).not.toBeNull();
    expect(globalModel?.id).toBe(enabledModel.id);
    expect(globalModel?.identifier).toBe("enabled-model");
  });
});

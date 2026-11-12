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
import { createMessage } from "./messages";
import {
  createThread,
  listThreads,
  loadThreadMessages,
  renameThread,
} from "./threads";

describe("threads repository regression tests", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(messages);
    await db.delete(chatThreads);
    await db.delete(llmModels);
    await db.delete(users);
  });

  it("createThread falls back to default title when given an empty or whitespace title", async () => {
    const user = await createUser({
      username: "7000000001",
      password: await hashPassword("password123"),
      role: "user",
    });

    const threadEmpty = await createThread({ title: "", userId: user.id });
    const threadSpaces = await createThread({ title: "   ", userId: user.id });
    expect(threadEmpty.id).toBeGreaterThan(0);
    expect(threadSpaces.id).toBeGreaterThan(0);

    const threads = await listThreads({ userId: user.id });
    const titles = threads.map((t) => t.title);
    expect(titles).toContain("گفتگوی جدید");
    expect(titles.filter((t) => t === "گفتگوی جدید")).toHaveLength(2);
  });

  it("listThreads orders new threads with null lastMessageAt at top using updatedAt", async () => {
    const user = await createUser({
      username: "7000000002",
      password: await hashPassword("password123"),
      role: "user",
    });

    // Thread 1 created earlier with an old lastMessageAt
    const oldDate = new Date(Date.now() - 60_000);
    const [threadOld] = await db
      .insert(chatThreads)
      .values({
        title: "Old Chat",
        userId: user.id,
        isArchived: false,
        lastMessageAt: oldDate,
        createdAt: oldDate,
        updatedAt: oldDate,
      })
      .returning();

    // Thread 2 created now with null lastMessageAt
    const threadNew = await createThread({
      title: "New Chat",
      userId: user.id,
    });

    const list = await listThreads({ userId: user.id });
    expect(list.length).toBe(2);
    // The newly created thread must be first
    expect(list[0].id).toBe(threadNew.id);
    expect(list[1].id).toBe(threadOld.id);
  });

  it("loadThreadMessages preserves messages when model record is missing or deleted", async () => {
    const user = await createUser({
      username: "7000000003",
      password: await hashPassword("password123"),
      role: "user",
    });

    const thread = await createThread({ userId: user.id });

    // Insert a valid model
    const [model] = await db
      .insert(llmModels)
      .values({
        identifier: "test-model",
        provider: "ollama",
        isEnabled: true,
      })
      .returning();

    // Create a message with the model
    await createMessage({
      threadId: thread.id,
      userId: user.id,
      modelId: model.id,
      role: "user",
      status: "finished",
      parts: [{ type: "text", text: "hello" }],
    });

    // Delete the model record directly (simulate missing/orphaned model)
    await db.run("PRAGMA foreign_keys = OFF");
    await db.delete(llmModels);
    await db.run("PRAGMA foreign_keys = ON");

    // With leftJoin, the message is still loaded and not silently dropped
    const loaded = await loadThreadMessages(thread.id, user.id);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].model).toBeNull();
  });

  it("renameThread trims title and rejects empty title", async () => {
    const user = await createUser({
      username: "7000000004",
      password: await hashPassword("password123"),
      role: "user",
    });

    const thread = await createThread({ userId: user.id });

    await expect(renameThread(thread.id, "   ", user.id)).rejects.toThrow();

    await renameThread(thread.id, "  New Title  ", user.id);
    const list = await listThreads({ userId: user.id });
    expect(list[0].title).toBe("New Title");
  });
});

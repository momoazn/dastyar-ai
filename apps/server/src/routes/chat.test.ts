import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  chatThreads,
  db,
  initializeDatabase,
  messages,
  users,
} from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { createThread } from "@/repositories/threads";
import { generateJwtToken } from "@/services/auth";
import chatApp from "./chat";

async function createTestUser(username: string) {
  return await createUser({
    username,
    password: await hashPassword("password123"),
    role: "user",
  });
}

function postChat(token: string, threadId: number) {
  return chatApp.request("/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "hello" }],
        },
      ],
      modelId: 999_999,
      threadId,
    }),
  });
}

describe("chat route thread ownership", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(messages);
    await db.delete(chatThreads);
    await db.delete(users);
  });

  it("rejects a thread that belongs to another user", async () => {
    const userA = await createTestUser("6000000001");
    const userB = await createTestUser("6000000002");
    const threadB = await createThread({ userId: userB.id });
    const tokenA = generateJwtToken(userA);

    const res = await postChat(tokenA, threadB.id);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("THREAD_NOT_FOUND");
    expect(await db.select().from(messages)).toHaveLength(0);
  });

  it("rejects a thread that does not exist", async () => {
    const userA = await createTestUser("6000000003");
    const res = await postChat(generateJwtToken(userA), 123_456);
    expect(res.status).toBe(404);
  });

  it("passes the ownership check for the own thread", async () => {
    const userA = await createTestUser("6000000004");
    const thread = await createThread({ userId: userA.id });

    const res = await postChat(generateJwtToken(userA), thread.id);
    const body = (await res.json()) as { error: { code: string } };

    // The model does not exist, so the request stops after the thread check
    expect(body.error.code).toBe("MODEL_NOT_FOUND");
  });

  it("rejects a model that is disabled", async () => {
    const userA = await createTestUser("6000000005");
    const thread = await createThread({ userId: userA.id });

    const { llmModels } = await import("@/database");
    const [disabledModel] = await db
      .insert(llmModels)
      .values({
        identifier: "disabled-chat-model",
        provider: "ollama",
        isEnabled: false,
      })
      .returning();

    const res = await chatApp.request("/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${generateJwtToken(userA)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            id: "m1",
            role: "user",
            parts: [{ type: "text", text: "hello" }],
          },
        ],
        modelId: disabledModel.id,
        threadId: thread.id,
      }),
    });

    const body = (await res.json()) as { error: { code: string } };
    expect(res.status).toBe(403);
    expect(body.error.code).toBe("MODEL_DISABLED");
  });
});

import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { call } from "@orpc/server";
import {
  db,
  generatedImages,
  imageThreads,
  initializeDatabase,
  users,
} from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { createImageThread } from "@/repositories/image-threads";
import { generateJwtToken } from "@/services/auth";
import { imageProcedures } from "./images";

async function makeUser(username: string) {
  return await createUser({
    username,
    password: await hashPassword("password123"),
    role: "user",
  });
}

function ctxFor(user: { id: number; username: string; role: string }) {
  const token = generateJwtToken(user);
  return {
    context: {
      req: { header: () => `Bearer ${token}` },
    } as never,
  };
}

describe("image procedures", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(generatedImages);
    await db.delete(imageThreads);
    await db.delete(users);
  });

  it("listByThread rejects thread belonging to another user", async () => {
    const userA = await makeUser("7000000010");
    const userB = await makeUser("7000000011");
    const threadB = await createImageThread({
      userId: userB.id,
      title: "Thread B",
    });

    await expect(
      call(
        imageProcedures.listByThread,
        { threadId: threadB.id },
        ctxFor(userA)
      )
    ).rejects.toThrow();
  });

  it("listByThread rejects non-existent thread", async () => {
    const userA = await makeUser("7000000012");

    await expect(
      call(imageProcedures.listByThread, { threadId: 999_999 }, ctxFor(userA))
    ).rejects.toThrow();
  });

  it("clearByThread rejects thread belonging to another user", async () => {
    const userA = await makeUser("7000000013");
    const userB = await makeUser("7000000014");
    const threadB = await createImageThread({
      userId: userB.id,
      title: "Thread B",
    });

    await expect(
      call(
        imageProcedures.clearByThread,
        { threadId: threadB.id },
        ctxFor(userA)
      )
    ).rejects.toThrow();
  });

  it("clearByThread rejects non-existent thread", async () => {
    const userA = await makeUser("7000000015");

    await expect(
      call(imageProcedures.clearByThread, { threadId: 999_999 }, ctxFor(userA))
    ).rejects.toThrow();
  });

  it("listByThread returns images for user's own thread", async () => {
    const userA = await makeUser("7000000016");
    const threadA = await createImageThread({
      userId: userA.id,
      title: "Thread A",
    });

    const result = await call(
      imageProcedures.listByThread,
      { threadId: threadA.id },
      ctxFor(userA)
    );
    expect(result).toEqual([]);
  });
});

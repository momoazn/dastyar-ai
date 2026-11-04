import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/config";
import {
  db,
  generatedImages,
  imageThreads,
  initializeDatabase,
  users,
} from "@/database";
import { createUser, hashPassword } from "./auth";
import {
  createImageThread,
  deleteImageThread,
  getImageThread,
  listImageThreads,
  renameImageThread,
  setImageThreadArchived,
  touchLastImageAt,
} from "./image-threads";
import { createGeneratedImage } from "./images";

async function cleanupTables() {
  await db.delete(generatedImages);
  await db.delete(imageThreads);
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

describe("Image Threads Repository", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await cleanupTables();
  });

  it("lists only threads owned by the requesting user", async () => {
    const userA = await createTestUser("3000000001");
    const userB = await createTestUser("3000000002");

    await createImageThread({ title: "A thread", userId: userA.id });
    await createImageThread({ title: "B thread", userId: userB.id });

    const userAThreads = await listImageThreads({ userId: userA.id });

    expect(userAThreads).toHaveLength(1);
    expect(userAThreads[0]?.title).toBe("A thread");
    expect(userAThreads[0]?.userId).toBe(userA.id);
  });

  it("does not return another user's thread", async () => {
    const userA = await createTestUser("3000000003");
    const userB = await createTestUser("3000000004");

    const created = await createImageThread({
      title: "Private thread",
      userId: userB.id,
    });

    const result = await getImageThread(created.id, userA.id);

    expect(result).toBeNull();
  });

  it("does not rename another user's thread", async () => {
    const userA = await createTestUser("3000000005");
    const userB = await createTestUser("3000000006");

    const created = await createImageThread({
      title: "Original title",
      userId: userB.id,
    });

    await renameImageThread(created.id, "Renamed by attacker", userA.id);

    const thread = await getImageThread(created.id, userB.id);
    expect(thread?.title).toBe("Original title");
  });

  it("does not archive or delete another user's thread", async () => {
    const userA = await createTestUser("3000000007");
    const userB = await createTestUser("3000000008");

    const created = await createImageThread({
      title: "Keep me",
      userId: userB.id,
    });

    await setImageThreadArchived(created.id, true, userA.id);
    await deleteImageThread(created.id, userA.id);

    const thread = await getImageThread(created.id, userB.id);
    expect(thread).not.toBeNull();
    expect(thread?.isArchived).toBe(false);
  });

  it("removes image files when the thread is deleted", async () => {
    const user = await createTestUser("3000000011");
    const created = await createImageThread({ title: "T", userId: user.id });
    mkdirSync(env.IMAGES_DIR, { recursive: true });
    const filePath = join(env.IMAGES_DIR, "thread-delete.png");
    writeFileSync(filePath, "x");
    await createGeneratedImage({
      prompt: "p",
      negativePrompt: null,
      filePath,
      fileName: "thread-delete.png",
      settings: {},
      threadId: created.id,
      userId: user.id,
    });

    await deleteImageThread(created.id, user.id);

    expect(existsSync(filePath)).toBe(false);
    expect(await getImageThread(created.id, user.id)).toBeNull();
  });

  it("updates lastImageAt only for the owning user", async () => {
    const userA = await createTestUser("3000000009");
    const userB = await createTestUser("3000000010");

    const created = await createImageThread({
      title: "Timestamp owner",
      userId: userB.id,
    });
    const updateDate = new Date("2026-01-02T03:04:05.000Z");

    await touchLastImageAt(created.id, userA.id, updateDate);
    const unauthorizedRead = await getImageThread(created.id, userB.id);
    expect(unauthorizedRead?.lastImageAt).toBeNull();

    await touchLastImageAt(created.id, userB.id, updateDate);
    const authorizedRead = await getImageThread(created.id, userB.id);
    expect(authorizedRead?.lastImageAt?.toISOString()).toBe(
      updateDate.toISOString()
    );
  });
});

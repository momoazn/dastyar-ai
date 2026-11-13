import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "@/config";
import {
  db,
  generatedImages,
  imageThreads,
  initializeDatabase,
  users,
} from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { createImageThread } from "@/repositories/image-threads";
import { createGeneratedImage } from "@/repositories/images";
import { generateJwtToken } from "@/services/auth";
import imagesApp from "./images";

async function makeUser(username: string) {
  return await createUser({
    username,
    password: await hashPassword("password123"),
    role: "user",
  });
}

describe("images route access control and path traversal", () => {
  let testImagesDir: string;
  let originalDir: string;

  beforeAll(async () => {
    await initializeDatabase();
    testImagesDir = mkdtempSync(path.join(tmpdir(), "test-route-images-"));
    originalDir = env.IMAGES_DIR;
    env.IMAGES_DIR = testImagesDir;
  });

  afterAll(() => {
    env.IMAGES_DIR = originalDir;
    rmSync(testImagesDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await db.delete(generatedImages);
    await db.delete(imageThreads);
    await db.delete(users);
  });

  it("rejects image belonging to another user", async () => {
    const userA = await makeUser("8000000001");
    const userB = await makeUser("8000000002");
    const threadB = await createImageThread({
      userId: userB.id,
      title: "Thread B",
    });

    const filePath = path.join(testImagesDir, "test.png");
    writeFileSync(filePath, "fake image content");

    const img = await createGeneratedImage({
      prompt: "test",
      negativePrompt: null,
      filePath,
      fileName: "test.png",
      settings: {},
      threadId: threadB.id,
      userId: userB.id,
    });

    const tokenA = generateJwtToken(userA);
    const res = await imagesApp.request(`/${img.id}/file`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });

    expect(res.status).toBe(404);
  });

  it("blocks path traversal when image path is outside IMAGES_DIR", async () => {
    const userA = await makeUser("8000000003");
    const threadA = await createImageThread({
      userId: userA.id,
      title: "Thread A",
    });

    const outsideDir = mkdtempSync(path.join(tmpdir(), "test-outside-"));
    const outsideFile = path.join(outsideDir, "test-outside.png");
    writeFileSync(outsideFile, "secret");

    try {
      const img = await createGeneratedImage({
        prompt: "test",
        negativePrompt: null,
        filePath: outsideFile,
        fileName: "test-outside.png",
        settings: {},
        threadId: threadA.id,
        userId: userA.id,
      });

      const tokenA = generateJwtToken(userA);
      const res = await imagesApp.request(`/${img.id}/file`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });

      expect(res.status).toBe(403);
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  it("allows owner to stream their image", async () => {
    const userA = await makeUser("8000000004");
    const threadA = await createImageThread({
      userId: userA.id,
      title: "Thread A",
    });

    const filePath = path.join(testImagesDir, "valid.png");
    writeFileSync(filePath, "image data");

    const img = await createGeneratedImage({
      prompt: "test",
      negativePrompt: null,
      filePath,
      fileName: "valid.png",
      settings: {},
      threadId: threadA.id,
      userId: userA.id,
    });

    const tokenA = generateJwtToken(userA);
    const res = await imagesApp.request(`/${img.id}/file`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("image data");
  });
});

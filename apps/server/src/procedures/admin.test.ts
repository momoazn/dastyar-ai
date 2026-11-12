import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { call } from "@orpc/server";
import { env } from "@/config";
import {
  chatThreads,
  db,
  documents,
  generatedImages,
  imageThreads,
  initializeDatabase,
  systemSettings,
  users,
} from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { createDocument } from "@/repositories/documents";
import { createImageThread } from "@/repositories/image-threads";
import { createGeneratedImage } from "@/repositories/images";
import { generateJwtToken } from "@/services/auth";
import { adminProcedures } from "./admin";

async function makeUser(username: string, role: "admin" | "user") {
  return await createUser({
    username,
    password: await hashPassword("password123"),
    role,
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

describe("admin user procedures", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(generatedImages);
    await db.delete(imageThreads);
    await db.delete(documents);
    await db.delete(chatThreads);
    await db.delete(users);
  });

  it("does not demote the only admin", async () => {
    const admin = await makeUser("7000000001", "admin");

    await expect(
      call(
        adminProcedures.updateUser,
        { userId: admin.id, role: "user" },
        ctxFor(admin)
      )
    ).rejects.toThrow();

    const rows = await db.select().from(users);
    expect(rows.at(0)?.role).toBe("admin");
  });

  it("demotes an admin when another admin exists", async () => {
    const admin = await makeUser("7000000002", "admin");
    const other = await makeUser("7000000003", "admin");

    const updated = await call(
      adminProcedures.updateUser,
      { userId: other.id, role: "user" },
      ctxFor(admin)
    );

    expect(updated.role).toBe("user");
  });

  it("does not delete the only admin", async () => {
    const admin = await makeUser("7000000004", "admin");
    await makeUser("7000000005", "user");

    await expect(
      call(adminProcedures.deleteUser, { userId: admin.id }, ctxFor(admin))
    ).rejects.toThrow();
  });

  it("removes user files when the user is deleted", async () => {
    const admin = await makeUser("7000000006", "admin");
    const victim = await makeUser("7000000007", "user");
    mkdirSync(env.DOCUMENTS_DIR, { recursive: true });
    mkdirSync(env.IMAGES_DIR, { recursive: true });
    const docPath = join(env.DOCUMENTS_DIR, "victim.txt");
    const imgPath = join(env.IMAGES_DIR, "victim.png");
    writeFileSync(docPath, "d");
    writeFileSync(imgPath, "i");
    await createDocument({
      title: "d",
      filePath: docPath,
      fileName: "victim.txt",
      mimeType: "text/plain",
      userId: victim.id,
    });
    const thread = await createImageThread({ userId: victim.id });
    await createGeneratedImage({
      prompt: "p",
      negativePrompt: null,
      filePath: imgPath,
      fileName: "victim.png",
      settings: {},
      threadId: thread.id,
      userId: victim.id,
    });

    await call(
      adminProcedures.deleteUser,
      { userId: victim.id },
      ctxFor(admin)
    );

    expect(existsSync(docPath)).toBe(false);
    expect(existsSync(imgPath)).toBe(false);
    expect(await db.select().from(documents)).toHaveLength(0);
    expect(await db.select().from(generatedImages)).toHaveLength(0);
  });

  it("rejects non-admin callers", async () => {
    const user = await makeUser("7000000008", "user");
    await expect(
      call(adminProcedures.deleteUser, { userId: user.id }, ctxFor(user))
    ).rejects.toThrow();
  });

  it("returns totalPages as at least 1 when total is 0", async () => {
    const admin = await makeUser("7000000009", "admin");
    const result = await call(
      adminProcedures.listUsers,
      { page: 1, pageSize: 10, search: "nonexistent_user_xyz" },
      ctxFor(admin)
    );
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it("initializes default settings when getAllSettings is called on empty table", async () => {
    const admin = await makeUser("7000000010", "admin");
    await db.delete(systemSettings);
    const settings = await call(
      adminProcedures.getAllSettings,
      undefined,
      ctxFor(admin)
    );
    expect(settings.length).toBeGreaterThan(0);
    expect(settings.some((s) => s.key === "enable_transcription")).toBe(true);
  });
});

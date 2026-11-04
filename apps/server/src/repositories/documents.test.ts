import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/config";
import {
  chatThreads,
  db,
  documentChunks,
  documents,
  initializeDatabase,
  threadDocuments,
  users,
} from "@/database";
import { createUser, hashPassword } from "./auth";
import {
  attachDocumentToThread,
  createDocument,
  deleteDocument,
  getDocumentById,
  listThreadDocuments,
} from "./documents";
import { createThread } from "./threads";

async function cleanupTables() {
  await db.delete(threadDocuments);
  await db.delete(documentChunks);
  await db.delete(documents);
  await db.delete(chatThreads);
  await db.delete(users);
}

async function createTestUser(username: string) {
  return await createUser({
    username,
    password: await hashPassword("password123"),
    role: "user",
  });
}

function createTestDocument(userId: number, name: string) {
  mkdirSync(env.DOCUMENTS_DIR, { recursive: true });
  const filePath = join(env.DOCUMENTS_DIR, name);
  writeFileSync(filePath, "hello");
  return createDocument({
    title: name,
    filePath,
    fileName: name,
    mimeType: "text/plain",
    userId,
  });
}

describe("Documents Repository", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await cleanupTables();
  });

  it("does not attach a document owned by another user", async () => {
    const userA = await createTestUser("4000000001");
    const userB = await createTestUser("4000000002");
    const thread = await createThread({ userId: userA.id });
    const docB = await createTestDocument(userB.id, "b.txt");

    await expect(
      attachDocumentToThread({
        threadId: thread.id,
        documentId: Number(docB.id),
        userId: userA.id,
      })
    ).rejects.toThrow();
    expect(
      await listThreadDocuments({ threadId: thread.id, userId: userA.id })
    ).toHaveLength(0);
  });

  it("attaches the same document once", async () => {
    const user = await createTestUser("4000000003");
    const thread = await createThread({ userId: user.id });
    const doc = await createTestDocument(user.id, "a.txt");
    const params = {
      threadId: thread.id,
      documentId: Number(doc.id),
      userId: user.id,
    };

    await attachDocumentToThread(params);
    await attachDocumentToThread(params);

    expect(await listThreadDocuments(params)).toHaveLength(1);
  });

  it("deletes the stored file with the document", async () => {
    const user = await createTestUser("4000000004");
    const doc = await createTestDocument(user.id, "c.txt");
    expect(existsSync(doc.filePath)).toBe(true);

    await deleteDocument(Number(doc.id), user.id);

    expect(existsSync(doc.filePath)).toBe(false);
    expect(await getDocumentById(Number(doc.id), user.id)).toBeNull();
  });
});

import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db, initializeDatabase, users } from "@/database";
import { createUser } from "@/repositories/auth";
import { createThread } from "@/repositories/threads";
import { sqliteDB } from "./connection";

describe("database connection", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  it("enforces foreign keys after migrations", () => {
    const row = sqliteDB.query("PRAGMA foreign_keys").get() as {
      foreign_keys: number;
    };
    expect(row.foreign_keys).toBe(1);
  });

  it("cascades deletes from a user to its threads", async () => {
    const user = await createUser({
      username: "5000000001",
      password: "hash",
      role: "user",
    });
    const thread = await createThread({ userId: user.id });
    await db.delete(users).where(eq(users.id, user.id));

    const left = sqliteDB
      .query("SELECT id FROM chat_threads WHERE id = ?")
      .all(thread.id);
    expect(left).toHaveLength(0);
  });
});

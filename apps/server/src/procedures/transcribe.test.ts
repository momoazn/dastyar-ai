import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { call } from "@orpc/server";
import { db, initializeDatabase, systemSettings, users } from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { upsertSetting } from "@/repositories/system-settings";
import { generateJwtToken } from "@/services/auth";
import { transcribeProcedures } from "./transcribe";

describe("transcribe procedures", () => {
  let userToken: string;

  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(systemSettings);
    await db.delete(users);

    const user = await createUser({
      username: "9999999999",
      password: await hashPassword("password123"),
      role: "user",
    });
    userToken = generateJwtToken(user);
  });

  const getCtx = () => ({
    context: {
      req: {
        header: (name: string) =>
          name.toLowerCase() === "authorization" ? `Bearer ${userToken}` : null,
      },
    } as never,
  });

  it("rejects transcription when enable_transcription is false", async () => {
    await upsertSetting("enable_transcription", false);

    const dummyFile = new File(["dummy audio content"], "test.webm", {
      type: "audio/webm",
    });

    await expect(
      call(
        transcribeProcedures.transcribe,
        { file: dummyFile, language: "fa" },
        getCtx()
      )
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("allows transcription check when enable_transcription is true", async () => {
    await upsertSetting("enable_transcription", true);

    const dummyFile = new File(["dummy audio content"], "test.webm", {
      type: "audio/webm",
    });

    // When enabled, it should pass the feature toggle check and reach the whisper service
    // (which may fail due to no whisper server running, resulting in TRANSCRIBE_FAILED / 500, not 403 FORBIDDEN)
    try {
      await call(
        transcribeProcedures.transcribe,
        { file: dummyFile, language: "fa" },
        getCtx()
      );
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number };
      expect(error.status).not.toBe(403);
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });
});

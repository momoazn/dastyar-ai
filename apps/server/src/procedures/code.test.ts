import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { call } from "@orpc/server";
import { codeRuns, db, initializeDatabase, llmModels, users } from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { createCodeRun } from "@/repositories/code-runs";
import { generateJwtToken } from "@/services/auth";
import { codeProcedures } from "./code";

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

describe("code procedures", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(codeRuns);
    await db.delete(users);
  });

  it("getRun returns run for owner and null for other users", async () => {
    const userA = await makeUser("9000000001");
    const userB = await makeUser("9000000002");

    const [model] = await db
      .insert(llmModels)
      .values({ identifier: "test-model-1", provider: "ollama" })
      .returning();

    const run = await createCodeRun({
      mode: "generate",
      language: "typescript",
      inputText: "test prompt",
      errorText: null,
      output: JSON.stringify({ generatedCode: "const x = 1;" }),
      modelId: model.id,
      userId: userA.id,
    });

    // Owner should retrieve it
    const resA = await call(
      codeProcedures.getRun,
      { id: run.id },
      ctxFor(userA)
    );
    expect(resA).not.toBeNull();
    expect(resA?.inputCode).toBe("test prompt");

    // Other user gets null
    const resB = await call(
      codeProcedures.getRun,
      { id: run.id },
      ctxFor(userB)
    );
    expect(resB).toBeNull();
  });

  it("deleteRun only deletes own run", async () => {
    const userA = await makeUser("9000000003");
    const userB = await makeUser("9000000004");

    const [model] = await db
      .insert(llmModels)
      .values({ identifier: "test-model-2", provider: "ollama" })
      .returning();

    const runA = await createCodeRun({
      mode: "explain",
      language: "python",
      inputText: "print(1)",
      errorText: null,
      output: JSON.stringify({ explanation: "prints 1" }),
      modelId: model.id,
      userId: userA.id,
    });

    // User B tries to delete User A's run
    await call(codeProcedures.deleteRun, { id: runA.id }, ctxFor(userB));

    // Run A should still exist
    const checkA = await call(
      codeProcedures.getRun,
      { id: runA.id },
      ctxFor(userA)
    );
    expect(checkA).not.toBeNull();

    // User A deletes their own run
    await call(codeProcedures.deleteRun, { id: runA.id }, ctxFor(userA));
    const checkAAfter = await call(
      codeProcedures.getRun,
      { id: runA.id },
      ctxFor(userA)
    );
    expect(checkAAfter).toBeNull();
  });
});

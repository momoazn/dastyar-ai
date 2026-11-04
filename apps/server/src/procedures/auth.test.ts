import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { call } from "@orpc/server";
import { db, initializeDatabase, users } from "@/database";
import { createUser, hashPassword } from "@/repositories/auth";
import { generateJwtToken } from "@/services/auth";
import { authProcedures } from "./auth";

const noHeader = () => null;
const honoContext = {
  req: {
    header: (name: string) => (name === "x-real-ip" ? "127.0.0.1" : null),
  },
};
const ctx = {
  context: { req: { header: noHeader }, honoContext } as never,
};

describe("auth procedures", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await db.delete(users);
  });

  it("register rejects a duplicate username", async () => {
    await call(
      authProcedures.register,
      { username: "1234567890", password: "password123" },
      ctx
    );
    await expect(
      call(
        authProcedures.register,
        { username: "1234567890", password: "password123" },
        ctx
      )
    ).rejects.toMatchObject({ code: "USERNAME_ALREADY_EXISTS", status: 400 });
  });

  it("login gives the same error for unknown user and wrong password", async () => {
    await createUser({
      username: "1234567890",
      password: await hashPassword("password123"),
      role: "user",
    });
    const wrongPassword = await call(
      authProcedures.login,
      { username: "1234567890", password: "nope-nope" },
      ctx
    ).catch((e) => e);
    const unknownUser = await call(
      authProcedures.login,
      { username: "0987654321", password: "password123" },
      ctx
    ).catch((e) => e);
    expect(wrongPassword.code).toBe("INVALID_CREDENTIALS");
    expect(unknownUser.code).toBe("INVALID_CREDENTIALS");
    expect(unknownUser.message).toBe(wrongPassword.message);
  });

  it("updatePassword maps a wrong current password to 401", async () => {
    const user = await createUser({
      username: "1234567890",
      password: await hashPassword("password123"),
      role: "user",
    });
    const token = generateJwtToken(user);
    await expect(
      call(
        authProcedures.updatePassword,
        { currentPassword: "wrong-one", newPassword: "newpassword1" },
        {
          context: {
            req: { header: () => `Bearer ${token}` },
            honoContext,
          } as never,
        }
      )
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
  });
});

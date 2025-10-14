import { ORPCError } from "@orpc/client";
import { z } from "zod";
import {
  createUser,
  hashPassword,
  usernameExists,
  verifyUserCredentials,
} from "@/repositories/auth";
import { generateJwtToken } from "@/services/auth";
import { protectedProcedure, publicProcedure } from "./base";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const authProcedures = {
  register: publicProcedure.input(registerSchema).handler(async ({ input }) => {
    const { username, password } = input;

    if (await usernameExists(username)) {
      console.warn(`[auth.register] Username already exists: ${username}`);
      throw new ORPCError("USERNAME_ALREADY_EXISTS", {
        message: "نام کاربری قبلاً استفاده شده است",
        status: 400,
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      username,
      password: hashedPassword,
      salt: "", // bcrypt handles salt internally
      role: "user",
    });

    const token = generateJwtToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }),

  login: publicProcedure.input(loginSchema).handler(async ({ input }) => {
    const { username, password } = input;

    const user = await verifyUserCredentials({ username, password });
    if (!user) {
      console.warn(`[auth.login] Invalid credentials: ${username}`);
      throw new ORPCError("INVALID_CREDENTIALS", {
        message: "نام کاربری یا رمز عبور اشتباه است",
        status: 401,
      });
    }

    const token = generateJwtToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }),

  me: protectedProcedure.handler(({ context }) => ({
    id: context.user.id,
    username: context.user.username,
    role: context.user.role,
  })),
};

import { ORPCError } from "@orpc/client";
import { z } from "zod";
import type { SelectUser } from "@/database";
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

function logEvent(event: string, data: Record<string, unknown> = {}) {
  const timestamp = new Date().toISOString();
  console.info(`[${timestamp}] ${event}`, data);
}

export const authProcedures = {
  register: publicProcedure.input(registerSchema).handler(async ({ input }) => {
    const { username, password } = input;

    logEvent("auth.register.attempt", { username });

    let exists = false;
    try {
      exists = await usernameExists(username);
      logEvent("auth.register.username.exists_check", { username, exists });
    } catch (err) {
      logEvent("auth.register.username.exists_check.error", {
        username,
        error: (err as Error)?.message || err,
      });
      throw new ORPCError("INTERNAL_ERROR", {
        message: "خطای داخلی سیستم",
        status: 500,
      });
    }

    if (exists) {
      console.warn(`[auth.register] Username already exists: ${username}`);
      logEvent("auth.register.failure", {
        username,
        reason: "USERNAME_ALREADY_EXISTS",
      });
      throw new ORPCError("USERNAME_ALREADY_EXISTS", {
        message: "نام کاربری قبلاً استفاده شده است",
        status: 400,
      });
    }
    logEvent("auth.register.username.available", { username });

    const hashedPassword = await hashPassword(password);
    logEvent("auth.register.hashed_password.created", { username });

    let user: SelectUser;
    try {
      user = await createUser({
        username,
        password: hashedPassword,
        salt: "", // bcrypt handles salt internally
        role: "user",
      });
      logEvent("auth.register.user.created", {
        userId: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (err) {
      logEvent("auth.register.user.creation_error", {
        username,
        error: (err as Error)?.message || err,
      });
      throw new ORPCError("USER_CREATION_FAILED", {
        message: "خطا در ایجاد کاربر",
        status: 500,
      });
    }

    const token = generateJwtToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    logEvent("auth.register.jwt.generated", { userId: user.id });

    logEvent("auth.register.success", {
      userId: user.id,
      username: user.username,
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
    logEvent("auth.login.attempt", { username });

    let user: SelectUser | null;
    try {
      user = await verifyUserCredentials({ username, password });
      logEvent("auth.login.credential_check.complete", {
        username,
        result: !!user,
      });
    } catch (err) {
      logEvent("auth.login.credential_check.error", {
        username,
        error: (err as Error)?.message || err,
      });
      throw new ORPCError("INTERNAL_ERROR", {
        message: "خطای داخلی سیستم",
        status: 500,
      });
    }

    if (!user) {
      console.warn(`[auth.login] Invalid credentials: ${username}`);
      logEvent("auth.login.failure", {
        username,
        reason: "INVALID_CREDENTIALS",
      });
      throw new ORPCError("INVALID_CREDENTIALS", {
        message: "نام کاربری یا رمز عبور اشتباه است",
        status: 401,
      });
    }

    logEvent("auth.login.success", {
      userId: user.id,
      username: user.username,
    });

    const token = generateJwtToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    logEvent("auth.login.jwt.generated", { userId: user.id });
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }),

  me: protectedProcedure.handler(({ context }) => {
    logEvent("auth.me.called", {
      userId: context.user.id,
      username: context.user.username,
      role: context.user.role,
    });
    return {
      id: context.user.id,
      username: context.user.username,
      role: context.user.role,
    };
  }),
};

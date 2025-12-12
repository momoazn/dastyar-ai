import { ORPCError } from "@orpc/client";
import { z } from "zod";
import type { SelectUser } from "@/database";
import { logger } from "@/lib/logger";
import {
  countUsers,
  createUser,
  hashPassword,
  updateUsername as updateUsernameRepo,
  updateUserPassword as updateUserPasswordRepo,
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

const updateUsernameSchema = z.object({
  newUsername: z.string().min(3).max(50),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

function logEvent(event: string, data: Record<string, unknown> = {}) {
  logger.info(event, data);
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
      logger.warn("Username already exists", {
        username,
        event: "auth.register",
      });
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

    // Check if this is the first user
    const userCount = await countUsers();
    const role = userCount === 0 ? "admin" : "user";

    let user: SelectUser;
    try {
      user = await createUser({
        username,
        password: hashedPassword,
        role,
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
      logger.warn("Invalid login credentials", {
        username,
        event: "auth.login",
      });
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

  updateUsername: protectedProcedure
    .input(updateUsernameSchema)
    .handler(async ({ input, context }) => {
      const { newUsername } = input;
      const userId = context.user.id;

      logEvent("auth.updateUsername.attempt", { userId, newUsername });

      try {
        // Check if username already exists
        const exists = await usernameExists(newUsername);
        if (exists) {
          logEvent("auth.updateUsername.failure", {
            userId,
            newUsername,
            reason: "USERNAME_ALREADY_EXISTS",
          });
          throw new ORPCError("USERNAME_ALREADY_EXISTS", {
            message: "نام کاربری قبلاً استفاده شده است",
            status: 400,
          });
        }

        // Update username
        const updatedUser = await updateUsernameRepo(userId, newUsername);
        logEvent("auth.updateUsername.success", {
          userId,
          oldUsername: context.user.username,
          newUsername,
        });

        // Generate new JWT token with updated username
        const token = generateJwtToken({
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
        });

        return {
          token,
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            role: updatedUser.role,
          },
        };
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error;
        }
        logEvent("auth.updateUsername.error", {
          userId,
          error: (error as Error)?.message || error,
        });
        throw new ORPCError("INTERNAL_ERROR", {
          message: "خطا در به‌روزرسانی نام کاربری",
          status: 500,
        });
      }
    }),

  updatePassword: protectedProcedure
    .input(updatePasswordSchema)
    .handler(async ({ input, context }) => {
      const { currentPassword, newPassword } = input;
      const userId = context.user.id;

      logEvent("auth.updatePassword.attempt", { userId });

      try {
        // Update password (includes current password verification)
        await updateUserPasswordRepo(userId, currentPassword, newPassword);
        logEvent("auth.updatePassword.success", { userId });

        return { success: true };
      } catch (error) {
        const errorMessage = (error as Error)?.message || "";
        if (errorMessage.includes("Current password is incorrect")) {
          logEvent("auth.updatePassword.failure", {
            userId,
            reason: "INVALID_CURRENT_PASSWORD",
          });
          throw new ORPCError("INVALID_CREDENTIALS", {
            message: "رمز عبور فعلی اشتباه است",
            status: 401,
          });
        }
        logEvent("auth.updatePassword.error", {
          userId,
          error: errorMessage,
        });
        throw new ORPCError("INTERNAL_ERROR", {
          message: "خطا در به‌روزرسانی رمز عبور",
          status: 500,
        });
      }
    }),
};

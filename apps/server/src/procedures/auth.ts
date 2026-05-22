import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getClientIpFromContext } from "@/lib/request-ip";
import { serverTexts } from "@/lib/texts";
import {
  countUsers,
  createUser,
  hashPassword,
  updateUsername as updateUsernameRepo,
  updateUserPassword as updateUserPasswordRepo,
  usernameExists,
  verifyUserCredentials,
} from "@/repositories/auth";
import { recordUserIp } from "@/repositories/user-ips";
import { generateJwtToken } from "@/services/auth";
import { protectedProcedure, publicProcedure } from "./base";

const nationalCodeSchema = z
  .string()
  .regex(/^\d{10}$/, serverTexts.config.validation.nationalCode);

const registerSchema = z.object({
  username: nationalCodeSchema,
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: nationalCodeSchema,
  password: z.string(),
});

const updateUsernameSchema = z.object({
  newUsername: nationalCodeSchema,
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export const authProcedures = {
  register: publicProcedure
    .input(registerSchema)
    .handler(async ({ input, context }) => {
      const { username, password } = input;

      const exists = await usernameExists(username);
      if (exists) {
        logger.info("کد ملی قبلاً استفاده شده است.", { username });
        throw new ORPCError("USERNAME_ALREADY_EXISTS", {
          message: serverTexts.auth.usernameExists,
          status: 400,
        });
      }

      const hashedPassword = await hashPassword(password);
      const userCount = await countUsers();
      const role = userCount === 0 ? "admin" : "user";

      const user = await createUser({
        username,
        password: hashedPassword,
        role,
      });

      const clientIp = getClientIpFromContext(context.honoContext);
      if (clientIp) {
        await recordUserIp({ userId: user.id, ipAddress: clientIp });
      }

      logger.info("User registered", { userId: user.id, username, role });

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

  login: publicProcedure
    .input(loginSchema)
    .handler(async ({ input, context }) => {
      const { username, password } = input;

      const user = await verifyUserCredentials({ username, password });

      if (!user) {
        logger.warn("Invalid login credentials", { username });
        throw new ORPCError("INVALID_CREDENTIALS", {
          message: serverTexts.auth.invalidCredentials,
          status: 401,
        });
      }

      logger.info("User logged in", { userId: user.id, username });

      const clientIp = getClientIpFromContext(context.honoContext);
      if (clientIp) {
        await recordUserIp({ userId: user.id, ipAddress: clientIp });
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

  updateUsername: protectedProcedure
    .input(updateUsernameSchema)
    .handler(async ({ input, context }) => {
      const { newUsername } = input;
      const userId = context.user.id;

      const exists = await usernameExists(newUsername);
      if (exists) {
        throw new ORPCError("USERNAME_ALREADY_EXISTS", {
          message: serverTexts.auth.usernameExists,
          status: 400,
        });
      }

      const updatedUser = await updateUsernameRepo(userId, newUsername);
      logger.info("Username updated", { userId, newUsername });

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
    }),

  updatePassword: protectedProcedure
    .input(updatePasswordSchema)
    .handler(async ({ input, context }) => {
      const { currentPassword, newPassword } = input;
      const userId = context.user.id;

      try {
        await updateUserPasswordRepo(userId, currentPassword, newPassword);
        logger.info("Password updated", { userId });
        return { success: true };
      } catch (error) {
        const errorMessage = (error as Error)?.message || "";
        if (errorMessage.includes("رمز عبور فعلی اشتباه است.")) {
          throw new ORPCError("INVALID_CREDENTIALS", {
            message: serverTexts.auth.wrongCurrentPassword,
            status: 401,
          });
        }
        logger.error("Password update failed", { userId, error: errorMessage });
        throw new ORPCError("INTERNAL_ERROR", {
          message: serverTexts.auth.passwordUpdateFailed,
          status: 500,
        });
      }
    }),
};

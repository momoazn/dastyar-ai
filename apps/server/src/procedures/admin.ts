import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  getUsersWithPagination,
  getUserWithStats,
  type UserListResponse,
  type UserWithStats,
  updateUser,
} from "@/repositories/admin";
import { createUser, hashPassword, usernameExists } from "@/repositories/auth";
import { addModel, getModels, updateModel } from "@/repositories/llm-models";
import {
  deleteSetting,
  getAllSettings,
  getSetting,
  initializeDefaultSettings,
  upsertSetting,
} from "@/repositories/system-settings";
import { adminProcedure } from "./base";

const updateUserSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(["admin", "user"]).optional(),
  password: z.string().min(6).optional(),
});

const toggleModelStatusSchema = z.object({
  modelId: z.number().int().positive(),
  isEnabled: z.boolean(),
});

const getUsersWithPaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
});

const deleteUserSchema = z.object({
  userId: z.number().int().positive(),
});

const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("user"),
});

const addModelSchema = z.object({
  identifier: z.string().min(1, "Model identifier is required"),
  provider: z.enum(["ollama", "lmstudio", "stable-diffusion", "whisper"]),
  creator: z.string().optional(),
  family: z.string().optional(),
  size: z.string().optional(),
});

const upsertSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
  description: z.string().optional(),
});

const getSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
});

export const adminProcedures = {
  // User Management
  listUsers: adminProcedure.handler(async () => {
    try {
      const users = await getAllUsers();
      return users;
    } catch (error) {
      logger.error("Error listing users", error);
      throw new ORPCError("INTERNAL_ERROR", {
        message: "Failed to fetch users",
        status: 500,
      });
    }
  }),

  listUsersWithPagination: adminProcedure
    .input(getUsersWithPaginationSchema)
    .handler(async ({ input }): Promise<UserListResponse> => {
      try {
        const result = await getUsersWithPagination(
          input.page,
          input.pageSize,
          input.search,
          input.role
        );
        return result;
      } catch (error) {
        logger.error("Error listing users with pagination", error);
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to fetch users",
          status: 500,
        });
      }
    }),

  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .handler(async ({ input }): Promise<UserWithStats | null> => {
      try {
        const userWithStats = await getUserWithStats(input.userId);
        return userWithStats;
      } catch (error) {
        logger.error("Error fetching user details", error);
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to fetch user details",
          status: 500,
        });
      }
    }),

  updateUser: adminProcedure
    .input(updateUserSchema)
    .handler(async ({ input }) => {
      try {
        const { userId, role, password } = input;

        // Check if user exists
        const user = await getUserById(userId);
        if (!user) {
          throw new ORPCError("USER_NOT_FOUND", {
            message: "User not found",
            status: 404,
          });
        }

        // At least one field must be provided
        if (role === undefined && password === undefined) {
          throw new ORPCError("INVALID_INPUT", {
            message: "At least one field (role or password) must be provided",
            status: 400,
          });
        }

        const updatedUser = await updateUser(userId, {
          role,
          password,
        });
        return updatedUser;
      } catch (error) {
        logger.error("Error updating user", error, { userId: input.userId });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to update user",
          status: 500,
        });
      }
    }),

  createUser: adminProcedure
    .input(createUserSchema)
    .handler(async ({ input }) => {
      try {
        const { username, password, role } = input;

        // Check if username already exists
        const exists = await usernameExists(username);
        if (exists) {
          throw new ORPCError("USERNAME_ALREADY_EXISTS", {
            message: "نام کاربری قبلاً استفاده شده است",
            status: 400,
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const newUser = await createUser({
          username,
          password: hashedPassword,
          role: role ?? "user",
        });

        return {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt,
        };
      } catch (error) {
        logger.error("Error creating user:", error, { function: "admin" });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to create user",
          status: 500,
        });
      }
    }),

  // Model Management
  listAllModels: adminProcedure.handler(async () => {
    try {
      const models = await getModels();
      return models;
    } catch (error) {
      logger.error("Error listing all models:", error, { function: "admin" });
      throw new ORPCError("INTERNAL_ERROR", {
        message: "Failed to fetch models",
        status: 500,
      });
    }
  }),

  toggleModelStatus: adminProcedure
    .input(toggleModelStatusSchema)
    .handler(async ({ input }) => {
      try {
        const { modelId, isEnabled } = input;

        const updatedModel = await updateModel(modelId, { isEnabled });
        return updatedModel;
      } catch (error) {
        logger.error("Error toggling model status:", error, {
          function: "admin",
        });
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to update model status",
          status: 500,
        });
      }
    }),

  deleteUser: adminProcedure
    .input(deleteUserSchema)
    .handler(async ({ input }) => {
      try {
        const { userId } = input;

        // Check if user exists
        const user = await getUserById(userId);
        if (!user) {
          throw new ORPCError("USER_NOT_FOUND", {
            message: "User not found",
            status: 404,
          });
        }

        // Prevent deleting if it's the only admin
        if (user.role === "admin") {
          const users = await getAllUsers();
          const adminCount = users.filter((u) => u.role === "admin").length;
          if (adminCount === 1) {
            throw new ORPCError("FORBIDDEN", {
              message: "Cannot delete the only admin user",
              status: 403,
            });
          }
        }

        await deleteUser(userId);
        return { success: true };
      } catch (error) {
        logger.error("Error deleting user:", error, { function: "admin" });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to delete user",
          status: 500,
        });
      }
    }),

  // Model Management
  addModel: adminProcedure.input(addModelSchema).handler(async ({ input }) => {
    try {
      const { identifier, provider, creator, family, size } = input;

      const newModel = await addModel(identifier, provider, {
        creator,
        family,
        size,
      });
      return newModel;
    } catch (error) {
      logger.error("Error adding model:", error, { function: "admin" });
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_ERROR", {
        message: "Failed to add model",
        status: 500,
      });
    }
  }),

  // System Settings Management
  getAllSettings: adminProcedure.handler(async () => {
    try {
      const settings = await getAllSettings();
      return settings;
    } catch (error) {
      logger.error("Error getting settings:", error, { function: "admin" });
      throw new ORPCError("INTERNAL_ERROR", {
        message: "Failed to get settings",
        status: 500,
      });
    }
  }),

  getSetting: adminProcedure
    .input(getSettingSchema)
    .handler(async ({ input }) => {
      try {
        const setting = await getSetting(input.key);
        if (!setting) {
          throw new ORPCError("NOT_FOUND", {
            message: `Setting '${input.key}' not found`,
            status: 404,
          });
        }
        return setting;
      } catch (error) {
        logger.error("Error getting setting:", error, { function: "admin" });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to get setting",
          status: 500,
        });
      }
    }),

  upsertSetting: adminProcedure
    .input(upsertSettingSchema)
    .handler(async ({ input }) => {
      try {
        const { key, value, description } = input;
        const setting = await upsertSetting(key, value, description);
        return setting;
      } catch (error) {
        logger.error("Error upserting setting:", error, { function: "admin" });
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to update setting",
          status: 500,
        });
      }
    }),

  deleteSetting: adminProcedure
    .input(getSettingSchema)
    .handler(async ({ input }) => {
      try {
        const success = await deleteSetting(input.key);
        if (!success) {
          throw new ORPCError("NOT_FOUND", {
            message: `Setting '${input.key}' not found`,
            status: 404,
          });
        }
        return { success: true };
      } catch (error) {
        logger.error("Error deleting setting:", error, { function: "admin" });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to delete setting",
          status: 500,
        });
      }
    }),

  initializeSettings: adminProcedure.handler(async () => {
    try {
      await initializeDefaultSettings();
      return { success: true };
    } catch (error) {
      logger.error("Error initializing settings:", error, {
        function: "admin",
      });
      throw new ORPCError("INTERNAL_ERROR", {
        message: "Failed to initialize settings",
        status: 500,
      });
    }
  }),
};

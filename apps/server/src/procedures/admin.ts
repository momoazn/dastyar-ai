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
  updateUserPassword,
  updateUserRole,
} from "@/repositories/admin";
import { addModel, getModels, updateModel } from "@/repositories/llm-models";
import {
  deleteSetting,
  getAllSettings,
  getSetting,
  initializeDefaultSettings,
  upsertSetting,
} from "@/repositories/system-settings";
import { adminProcedure } from "./base";

const updateUserRoleSchema = z.object({
  userId: z.number().int().positive(),
  newRole: z.enum(["admin", "user"]),
});

const updateUserPasswordSchema = z.object({
  userId: z.number().int().positive(),
  newPassword: z.string().min(6),
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

const addModelSchema = z.object({
  identifier: z.string().min(1, "Model identifier is required"),
  provider: z.enum(["ollama", "lmstudio", "stable-diffusion", "whisper"]),
  creator: z.string().optional(),
  family: z.string().optional(),
  size: z.string().optional(),
});

const upsertSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.unknown(),
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

  updateUserRole: adminProcedure
    .input(updateUserRoleSchema)
    .handler(async ({ input }) => {
      const { userId, newRole } = input;
      try {
        // Check if user exists
        const user = await getUserById(userId);
        if (!user) {
          throw new ORPCError("USER_NOT_FOUND", {
            message: "User not found",
            status: 404,
          });
        }

        const updatedUser = await updateUserRole(userId, newRole);
        return updatedUser;
      } catch (error) {
        logger.error("Error updating user role", error, { userId, newRole });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to update user role",
          status: 500,
        });
      }
    }),

  updateUserPassword: adminProcedure
    .input(updateUserPasswordSchema)
    .handler(async ({ input }) => {
      try {
        const { userId, newPassword } = input;

        // Check if user exists
        const user = await getUserById(userId);
        if (!user) {
          throw new ORPCError("USER_NOT_FOUND", {
            message: "User not found",
            status: 404,
          });
        }

        await updateUserPassword(userId, newPassword);
        return { success: true };
      } catch (error) {
        logger.error("Error updating user password:", error, {
          function: "admin",
        });
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to update user password",
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

import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  deleteUser,
  getUserById,
  getUserWithStats,
  listUsers,
  type UserListResponse,
  type UserWithStats,
  updateUser,
} from "@/repositories/admin";
import { createUser, hashPassword, usernameExists } from "@/repositories/auth";
import {
  addModel,
  getModels,
  syncModels,
  updateModel,
} from "@/repositories/llm-models";
import {
  createOllamaServer,
  deleteOllamaServer,
  getOllamaModelCoverageCounts,
  getOllamaServerById,
  listOllamaServerModelIdentifiers,
  listOllamaServers,
  updateOllamaServer,
} from "@/repositories/ollama-servers";
import {
  deleteSetting,
  getAllSettings,
  getSetting,
  initializeDefaultSettings,
  upsertSetting,
} from "@/repositories/system-settings";
import {
  syncAllOllamaServerModels,
  syncOllamaModelsForServer,
  testOllamaServerConnection,
} from "@/services/ai-providers/ollama-provider";
import { getOllamaServerRuntimeMetrics } from "@/services/ai-providers/ollama-router";
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

const listUsersSchema = z.object({
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

const ollamaServerBaseSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  baseUrl: z.string().min(1, "Server base URL is required"),
  isEnabled: z.boolean().default(true),
});

const ollamaServerIdSchema = z.object({
  id: z.number().int().positive(),
});

const updateOllamaServerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  baseUrl: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
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

const hasSqliteUniqueConstraint = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toUpperCase();
  return message.includes("UNIQUE");
};

const rethrowAdminError = (
  operation: string,
  error: unknown,
  internalMessage: string,
  context?: Record<string, unknown>
): never => {
  logger.error(operation, error, {
    function: "admin",
    ...context,
  });
  if (error instanceof ORPCError) {
    throw error;
  }
  throw new ORPCError("INTERNAL_ERROR", {
    message: internalMessage,
    status: 500,
  });
};

export const adminProcedures = {
  // User Management
  listUsers: adminProcedure.input(listUsersSchema).handler(
    async ({ input }): Promise<UserListResponse> =>
      listUsers({
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
        role: input.role,
      })
  ),

  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .handler(
      async ({ input }): Promise<UserWithStats | null> =>
        getUserWithStats(input.userId)
    ),

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
      let models = await getModels();
      if (models.length === 0) {
        const discovered = await syncAllOllamaServerModels();
        if (discovered.length > 0) {
          models = await syncModels(discovered);
        }
      }
      const coverageByIdentifier = await getOllamaModelCoverageCounts();
      return models.map((model) => ({
        ...model,
        serverCoverage:
          model.provider === "ollama"
            ? (coverageByIdentifier[model.identifier] ?? 0)
            : 0,
      }));
    } catch (error) {
      return rethrowAdminError(
        "Error listing all models",
        error,
        "Failed to fetch models"
      );
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
        return rethrowAdminError(
          "Error toggling model status",
          error,
          "Failed to update model status"
        );
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
          const allUsers = await listUsers({ page: 1, pageSize: 1000 });
          const adminCount = allUsers.users.filter(
            (u) => u.role === "admin"
          ).length;
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

  listOllamaServers: adminProcedure.handler(async () => {
    try {
      const servers = await listOllamaServers({
        includeDisabled: true,
        ensureDefault: true,
      });
      const runtimeMetrics = await getOllamaServerRuntimeMetrics(servers);
      const runtimeByServerId = new Map(
        runtimeMetrics.map((metric) => [metric.serverId, metric])
      );
      const serverModels = await Promise.all(
        servers.map((server) => listOllamaServerModelIdentifiers(server.id))
      );

      return servers.map((server, index) => ({
        ...server,
        models: serverModels[index] ?? [],
        modelCount: (serverModels[index] ?? []).length,
        runtime: runtimeByServerId.get(server.id) ?? {
          inFlight: 0,
          runningModels: 0,
          reachable: false,
          busyScore: 0,
          ewmaLatencyMs: 0,
        },
      }));
    } catch (error) {
      return rethrowAdminError(
        "Error listing Ollama servers",
        error,
        "Failed to fetch Ollama servers"
      );
    }
  }),

  createOllamaServer: adminProcedure
    .input(ollamaServerBaseSchema)
    .handler(async ({ input }) => {
      try {
        const server = await createOllamaServer(input);
        const discovered = await syncOllamaModelsForServer(server);
        await syncModels(discovered);
        return server;
      } catch (error) {
        if (hasSqliteUniqueConstraint(error)) {
          throw new ORPCError("CONFLICT", {
            message: "Server base URL already exists",
            status: 409,
          });
        }
        return rethrowAdminError(
          "Error creating Ollama server",
          error,
          "Failed to create Ollama server",
          { input }
        );
      }
    }),

  updateOllamaServer: adminProcedure
    .input(updateOllamaServerSchema)
    .handler(async ({ input }) => {
      try {
        const existing = await getOllamaServerById(input.id);
        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Ollama server not found",
            status: 404,
          });
        }

        const updated = await updateOllamaServer(input.id, {
          name: input.name,
          baseUrl: input.baseUrl,
          isEnabled: input.isEnabled,
        });

        if (input.baseUrl !== undefined) {
          const discovered = await syncOllamaModelsForServer(updated);
          await syncModels(discovered);
        }

        return updated;
      } catch (error) {
        if (hasSqliteUniqueConstraint(error)) {
          throw new ORPCError("CONFLICT", {
            message: "Server base URL already exists",
            status: 409,
          });
        }
        return rethrowAdminError(
          "Error updating Ollama server",
          error,
          "Failed to update Ollama server",
          { input }
        );
      }
    }),

  deleteOllamaServer: adminProcedure
    .input(ollamaServerIdSchema)
    .handler(async ({ input }) => {
      try {
        const existing = await getOllamaServerById(input.id);
        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Ollama server not found",
            status: 404,
          });
        }

        await deleteOllamaServer(input.id);
        return { success: true };
      } catch (error) {
        return rethrowAdminError(
          "Error deleting Ollama server",
          error,
          "Failed to delete Ollama server",
          { input }
        );
      }
    }),

  syncOllamaServerModels: adminProcedure
    .input(ollamaServerIdSchema)
    .handler(async ({ input }) => {
      try {
        const existing = await getOllamaServerById(input.id);
        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Ollama server not found",
            status: 404,
          });
        }
        const models = await syncOllamaModelsForServer(existing);
        await syncModels(models);
        return { success: true, modelCount: models.length };
      } catch (error) {
        return rethrowAdminError(
          "Error syncing Ollama server models",
          error,
          "Failed to sync Ollama server models",
          { input }
        );
      }
    }),

  syncAllOllamaServersModels: adminProcedure.handler(async () => {
    try {
      const models = await syncAllOllamaServerModels();
      await syncModels(models);
      return { success: true, modelCount: models.length };
    } catch (error) {
      return rethrowAdminError(
        "Error syncing all Ollama server models",
        error,
        "Failed to sync Ollama server models"
      );
    }
  }),

  testOllamaServerConnection: adminProcedure
    .input(ollamaServerIdSchema)
    .handler(async ({ input }) => {
      try {
        const existing = await getOllamaServerById(input.id);
        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Ollama server not found",
            status: 404,
          });
        }
        return await testOllamaServerConnection(existing.baseUrl);
      } catch (error) {
        return rethrowAdminError(
          "Error testing Ollama server",
          error,
          "Failed to test Ollama server",
          { input }
        );
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
      return rethrowAdminError(
        "Error adding model",
        error,
        "Failed to add model"
      );
    }
  }),

  // System Settings Management
  getAllSettings: adminProcedure.handler(async () => {
    try {
      const settings = await getAllSettings();
      return settings;
    } catch (error) {
      return rethrowAdminError(
        "Error getting settings",
        error,
        "Failed to get settings"
      );
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
        return rethrowAdminError(
          "Error getting setting",
          error,
          "Failed to get setting"
        );
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
        return rethrowAdminError(
          "Error upserting setting",
          error,
          "Failed to update setting"
        );
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
        return rethrowAdminError(
          "Error deleting setting",
          error,
          "Failed to delete setting"
        );
      }
    }),

  initializeSettings: adminProcedure.handler(async () => {
    try {
      await initializeDefaultSettings();
      return { success: true };
    } catch (error) {
      return rethrowAdminError(
        "Error initializing settings",
        error,
        "Failed to initialize settings"
      );
    }
  }),
};

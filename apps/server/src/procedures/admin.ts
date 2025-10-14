import { ORPCError } from "@orpc/client";
import { z } from "zod";
import {
  getAllUsers,
  getUserById,
  updateUserPassword,
  updateUserRole,
} from "@/repositories/admin";
import { getModels, updateModel } from "@/repositories/llm-models";
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

export const adminProcedures = {
  // User Management
  listUsers: adminProcedure.handler(async () => {
    try {
      const users = await getAllUsers();
      return users;
    } catch (error) {
      console.error("Error listing users:", error);
      throw new ORPCError("INTERNAL_ERROR", {
        message: "Failed to fetch users",
        status: 500,
      });
    }
  }),

  updateUserRole: adminProcedure
    .input(updateUserRoleSchema)
    .handler(async ({ input }) => {
      try {
        const { userId, newRole } = input;

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
        console.error("Error updating user role:", error);
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
        console.error("Error updating user password:", error);
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
      console.error("Error listing all models:", error);
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
        console.error("Error toggling model status:", error);
        throw new ORPCError("INTERNAL_ERROR", {
          message: "Failed to update model status",
          status: 500,
        });
      }
    }),
};

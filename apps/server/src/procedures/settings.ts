import { ORPCError } from "@orpc/client";
import { z } from "zod";
import {
  codeModes,
  languageCodes,
  programmingLanguages,
  summaryModes,
  tones,
  transcribeLanguages,
} from "@/database/schema/types";
import { logger } from "@/lib/logger";
import {
  getOrCreateUserPreferences,
  updateUserPreferences,
} from "@/repositories/user-preferences";
import { protectedProcedure } from "./base";

const updatePreferencesSchema = z.object({
  codeModelId: z.number().int().positive().nullable().optional(),
  codeMode: z.enum(codeModes).nullable().optional(),
  codeLanguage: z.enum(programmingLanguages).nullable().optional(),
  translationModelId: z.number().int().positive().nullable().optional(),
  translationSourceLanguage: z.enum(languageCodes).nullable().optional(),
  translationTargetLanguage: z.enum(languageCodes).nullable().optional(),
  translationTone: z.enum(tones).nullable().optional(),
  summarizeModelId: z.number().int().positive().nullable().optional(),
  summarizeMode: z.enum(summaryModes).nullable().optional(),
  summarizeTone: z.enum(tones).nullable().optional(),
  transcribeModel: z.string().nullable().optional(),
  transcribeLanguage: z.enum(transcribeLanguages).nullable().optional(),
});

export const settingsProcedures = {
  getPreferences: protectedProcedure.handler(async ({ context }) => {
    try {
      const preferences = await getOrCreateUserPreferences(context.user.id);
      return preferences;
    } catch (error) {
      logger.error("Error getting user preferences", error, {
        userId: context.user.id,
      });
      throw new ORPCError("INTERNAL_ERROR", {
        message: "خطا در دریافت تنظیمات کاربر",
        status: 500,
      });
    }
  }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .handler(async ({ input, context }) => {
      try {
        const updatedPreferences = await updateUserPreferences(
          context.user.id,
          input
        );
        return updatedPreferences;
      } catch (error) {
        logger.error("Error updating user preferences", error, {
          userId: context.user.id,
        });
        throw new ORPCError("INTERNAL_ERROR", {
          message: "خطا در به‌روزرسانی تنظیمات کاربر",
          status: 500,
        });
      }
    }),
};

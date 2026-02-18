import { eq, inArray } from "drizzle-orm";
import { db } from "@/database";
import {
  type InsertSystemSetting,
  type SystemSetting,
  systemSettings,
} from "@/database/schema";
import type { ConfigValue } from "@/types/config";

/**
 * Get all system settings
 */
export async function getAllSettings(): Promise<SystemSetting[]> {
  const result = await db.select().from(systemSettings);
  return result as SystemSetting[];
}

/**
 * Get a specific setting by key
 */
export async function getSetting(key: string): Promise<SystemSetting | null> {
  const result = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return (result[0] ?? null) as SystemSetting | null;
}

/**
 * Get multiple settings by keys
 */
export async function getSettingsByKeys(
  keys: string[]
): Promise<SystemSetting[]> {
  if (keys.length === 0) {
    return [];
  }
  const result = await db
    .select()
    .from(systemSettings)
    .where(inArray(systemSettings.key, keys));
  return result as SystemSetting[];
}

/**
 * Get setting value, returns default if not found
 */
export async function getSettingValue(
  key: string,
  defaultValue?: ConfigValue
): Promise<ConfigValue | undefined> {
  const setting = await getSetting(key);
  if (!setting) return defaultValue;
  return setting.value as ConfigValue;
}

/**
 * Create or update a setting
 */
export async function upsertSetting(
  key: string,
  value: ConfigValue,
  description?: string
): Promise<SystemSetting> {
  const existing = await getSetting(key);

  if (existing) {
    const updated = await db
      .update(systemSettings)
      .set({
        value: value as InsertSystemSetting["value"],
        description,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.key, key))
      .returning();
    if (!updated[0]) {
      throw new Error(`Failed to update system setting with key: ${key}`);
    }
    return updated[0] as SystemSetting;
  }

  const created = await db
    .insert(systemSettings)
    .values({
      key,
      value: value as InsertSystemSetting["value"],
      description,
    })
    .returning();
  if (!created[0]) {
    throw new Error(`Failed to create system setting with key: ${key}`);
  }
  return created[0] as SystemSetting;
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  await db.delete(systemSettings).where(eq(systemSettings.key, key));
  return true;
}

/**
 * Initialize default settings if they don't exist
 */
export const FEATURE_TOGGLE_DEFAULTS = {
  enable_chat: true,
  enable_translation: true,
  enable_summary: true,
  enable_transcription: true,
  enable_code_execution: true,
  enable_image_generation: true,
} as const;

export async function initializeDefaultSettings(): Promise<void> {
  const defaults: Record<string, ConfigValue> = {
    app_name: "Dastyar AI",
    app_description: "Persian AI Assistant",
    max_file_size_mb: 50,
    allowed_file_types: [
      "pdf",
      "txt",
      "docx",
      "doc",
      "xlsx",
      "xls",
      "pptx",
      "ppt",
    ],
    token_expiration_hours: 24,
    session_timeout_minutes: 30,
    password_min_length: 6,
    password_require_special_chars: false,
    password_require_numbers: false,
    password_require_uppercase: false,
    model_response_timeout_seconds: 300,
    ...FEATURE_TOGGLE_DEFAULTS,
  };

  for (const [key, value] of Object.entries(defaults)) {
    const existing = await getSetting(key);
    if (!existing) {
      await upsertSetting(key, value);
    }
  }
}

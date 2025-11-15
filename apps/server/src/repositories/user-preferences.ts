import { eq } from "drizzle-orm";
import {
  db,
  type InsertUserPreferences,
  type SelectUserPreferences,
  userPreferences,
} from "@/database";
import { logger } from "@/lib/logger";

/**
 * Get user preferences by user ID
 * Returns null if no preferences exist for the user
 */
export async function getUserPreferences(
  userId: number
): Promise<SelectUserPreferences | null> {
  try {
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });
    return preferences ?? null;
  } catch (error) {
    logger.error("Error fetching user preferences", error, { userId });
    throw error;
  }
}

/**
 * Get or create default user preferences
 * If preferences don't exist, creates an empty preferences record
 */
export async function getOrCreateUserPreferences(
  userId: number
): Promise<SelectUserPreferences> {
  try {
    let preferences = await getUserPreferences(userId);

    if (!preferences) {
      // Create default preferences
      const result = await db
        .insert(userPreferences)
        .values({
          userId,
        })
        .returning();

      preferences = result[0];
      logger.info("Created default user preferences", { userId });
    }

    return preferences;
  } catch (error) {
    logger.error("Error getting or creating user preferences", error, {
      userId,
    });
    throw error;
  }
}

/**
 * Update user preferences
 * Only updates the fields provided in the partial preferences object
 */
export async function updateUserPreferences(
  userId: number,
  preferences: Partial<
    Omit<InsertUserPreferences, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<SelectUserPreferences> {
  try {
    // Ensure preferences record exists
    await getOrCreateUserPreferences(userId);

    // Update preferences
    const result = await db
      .update(userPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!result[0]) {
      throw new Error("Failed to update user preferences");
    }

    logger.info("Updated user preferences", { userId });
    return result[0];
  } catch (error) {
    logger.error("Error updating user preferences", error, { userId });
    throw error;
  }
}

/**
 * Upsert user preferences
 * Creates or updates preferences for a user
 */
export async function upsertUserPreferences(
  userId: number,
  preferences: Partial<
    Omit<InsertUserPreferences, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<SelectUserPreferences> {
  try {
    const existing = await getUserPreferences(userId);

    if (existing) {
      return await updateUserPreferences(userId, preferences);
    }

    // Create new preferences
    const result = await db
      .insert(userPreferences)
      .values({
        userId,
        ...preferences,
      })
      .returning();

    if (!result[0]) {
      throw new Error("Failed to create user preferences");
    }

    logger.info("Created user preferences", { userId });
    return result[0];
  } catch (error) {
    logger.error("Error upserting user preferences", error, { userId });
    throw error;
  }
}

/**
 * Delete user preferences
 */
export async function deleteUserPreferences(userId: number): Promise<void> {
  try {
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    logger.info("Deleted user preferences", { userId });
  } catch (error) {
    logger.error("Error deleting user preferences", error, { userId });
    throw error;
  }
}

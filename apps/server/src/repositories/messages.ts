import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  type JsonValue,
  llmModels,
  messages as messagesTable,
  type SelectLlmModel,
  type SelectMessage,
} from "@/database";
import { logger } from "@/lib/logger";

export type CreateMessageParams = Omit<
  SelectMessage,
  "id" | "createdAt" | "updatedAt" | "parts"
> & {
  parts: unknown;
};

export type UpdateMessageParams = {
  id: SelectMessage["id"];
  parts?: SelectMessage["parts"];
  status?: SelectMessage["status"];
};

export async function appendMessageParts(params: {
  id: number;
  parts: JsonValue[];
  status?: SelectMessage["status"];
}): Promise<void> {
  if (params.parts.length === 0) {
    return;
  }

  try {
    const fragments = params.parts.map(
      (part) => sql`, '$[#]', json(${JSON.stringify(part)})`
    );

    await db.run(
      sql`
        UPDATE ${messagesTable}
        SET
          parts = json_insert(
            CASE
              WHEN json_valid(${messagesTable.parts}) = 1 AND json_type(${messagesTable.parts}) = 'array' THEN ${messagesTable.parts}
              ELSE json('[]')
            END
            ${sql.join(fragments, sql.raw(""))}
          ),
          status = ${params.status ?? "streaming"},
          updated_at = ${new Date()}
        WHERE ${eq(messagesTable.id, params.id)}
      `
    );
  } catch (error) {
    logger.error("Failed to append message parts", error, {
      messageId: params.id,
    });
    throw new Error("افزودن بخش‌های پیام ناموفق بود.");
  }
}

export async function createMessage(
  params: CreateMessageParams
): Promise<{ id: number }> {
  try {
    const result = await db
      .insert(messagesTable)
      .values({
        threadId: params.threadId,
        role: params.role,
        parts: params.parts,
        status: params.status,
        modelId: params.modelId,
        userId: params.userId,
      })
      .returning();

    return { id: Number(result.at(0)?.id) };
  } catch (error) {
    logger.error("Failed to save message", error, {
      threadId: params.threadId,
      role: params.role,
    });
    throw new Error("ذخیره پیام ناموفق بود.");
  }
}

export async function updateMessage(
  params: UpdateMessageParams
): Promise<void> {
  try {
    const updateData: Partial<typeof messagesTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (params.parts !== undefined) {
      updateData.parts = params.parts;
    }
    if (params.status !== undefined) {
      updateData.status = params.status;
    }

    if (Object.keys(updateData).length <= 1) {
      return;
    }

    await db
      .update(messagesTable)
      .set(updateData)
      .where(eq(messagesTable.id, params.id))
      .run();
  } catch (error) {
    logger.error("Failed to update message", error, { messageId: params.id });
    throw new Error("به‌روزرسانی پیام ناموفق بود.");
  }
}

export async function saveMessages(
  params: CreateMessageParams[]
): Promise<{ count: number }> {
  try {
    if (params.length === 0) {
      return { count: 0 };
    }

    await db
      .insert(messagesTable)
      .values(
        params.map((message) => ({
          threadId: message.threadId,
          role: message.role,
          parts: message.parts,
          status: message.status,
          modelId: message.modelId,
          userId: message.userId,
        }))
      )
      .run();

    return { count: params.length };
  } catch (error) {
    logger.error("Failed to save messages:", error, { function: "messages" });
    throw new Error("ذخیره پیام‌ها ناموفق بود.");
  }
}

export async function getMessagesByThread(
  params: { threadId: number } & {
    limit?: number;
    cursor?: string | null;
    order?: "asc" | "desc";
  }
): Promise<SelectMessage[]> {
  try {
    const limit = params.limit ?? 50;
    const order = params.order ?? "desc";

    const query = db
      .select({
        id: messagesTable.id,
        parts: messagesTable.parts,
        status: messagesTable.status,
        role: messagesTable.role,
        modelId: messagesTable.modelId,
        threadId: messagesTable.threadId,
        createdAt: messagesTable.createdAt,
        updatedAt: messagesTable.updatedAt,
        userId: messagesTable.userId,
      })
      .from(messagesTable)
      .where(eq(messagesTable.threadId, params.threadId))
      .orderBy(
        order === "asc"
          ? asc(messagesTable.createdAt)
          : desc(messagesTable.createdAt)
      )
      .limit(limit);

    const rows = await query;
    return rows as SelectMessage[];
  } catch (error) {
    logger.error("Failed to get messages for thread", error, {
      threadId: params.threadId,
    });
    throw new Error("دریافت پیام‌ها ناموفق بود.");
  }
}

export async function deleteMessage(id: number, userId: number): Promise<void> {
  try {
    await db
      .delete(messagesTable)
      .where(and(eq(messagesTable.id, id), eq(messagesTable.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to delete message", error, { messageId: id });
    throw new Error("حذف پیام ناموفق بود.");
  }
}

export async function clearThread(
  threadId: number,
  userId: number
): Promise<void> {
  try {
    await db
      .delete(messagesTable)
      .where(
        and(
          eq(messagesTable.threadId, threadId),
          eq(messagesTable.userId, userId)
        )
      )
      .run();
  } catch (error) {
    logger.error("Failed to clear thread", error, { threadId });
    throw new Error("پاک کردن گفتگو ناموفق بود.");
  }
}

export async function getLastUsedModelInThread(
  threadId: number,
  userId: number
): Promise<SelectLlmModel | null> {
  try {
    const rows = await db
      .select({
        id: llmModels.id,
        identifier: llmModels.identifier,
        provider: llmModels.provider,
        creator: llmModels.creator,
        family: llmModels.family,
        size: llmModels.size,
        isEnabled: llmModels.isEnabled,
        createdAt: llmModels.createdAt,
        updatedAt: llmModels.updatedAt,
      })
      .from(messagesTable)
      .innerJoin(llmModels, eq(messagesTable.modelId, llmModels.id))
      .where(
        and(
          eq(messagesTable.threadId, threadId),
          eq(messagesTable.userId, userId)
        )
      )
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    logger.error("Failed to get last used model for thread", error, {
      threadId,
    });
    throw new Error("دریافت آخرین مدل استفاده‌شده ناموفق بود.");
  }
}

export async function getLastUsedModelGlobal(
  userId: number
): Promise<SelectLlmModel | null> {
  try {
    const rows = await db
      .select({
        id: llmModels.id,
        identifier: llmModels.identifier,
        provider: llmModels.provider,
        creator: llmModels.creator,
        family: llmModels.family,
        size: llmModels.size,
        isEnabled: llmModels.isEnabled,
        createdAt: llmModels.createdAt,
        updatedAt: llmModels.updatedAt,
      })
      .from(messagesTable)
      .innerJoin(llmModels, eq(messagesTable.modelId, llmModels.id))
      .where(eq(messagesTable.userId, userId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    logger.error("Failed to get last used model globally:", error, {
      function: "messages",
    });
    throw new Error("دریافت آخرین مدل استفاده‌شده ناموفق بود.");
  }
}

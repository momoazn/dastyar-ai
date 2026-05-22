import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import {
  db,
  type LLMModel,
  type LLMModelProvider,
  llmModels,
} from "@/database";

type ModelFilter = Partial<{
  id: number;
  identifier: string;
  provider: LLMModelProvider;
  isEnabled: boolean;
}>;

// Regex to extract size from model names (e.g., "llama-3.1-8b" -> "8b")
const SIZE_REGEX = /[-:]([0-9.]+[a-z]+|e\d+[a-z]+)$/i;

export async function getModelById(id: number): Promise<LLMModel | null> {
  const result = await db.query.llmModels.findFirst({
    where: eq(llmModels.id, id),
  });
  return result ?? null;
}

export async function getModels(where: ModelFilter = {}): Promise<LLMModel[]> {
  const conditions: ReturnType<typeof eq>[] = [];
  if (where.id !== undefined) {
    conditions.push(eq(llmModels.id, where.id));
  }
  if (where.identifier !== undefined) {
    conditions.push(eq(llmModels.identifier, where.identifier));
  }
  if (where.provider !== undefined) {
    conditions.push(eq(llmModels.provider, where.provider));
  }
  if (where.isEnabled !== undefined) {
    conditions.push(eq(llmModels.isEnabled, where.isEnabled));
  }

  const query = db.select().from(llmModels);
  if (conditions.length === 0) {
    return await query;
  }
  if (conditions.length === 1) {
    return await query.where(conditions[0]);
  }

  return await query.where(and(...conditions));
}

export async function addModel(
  identifier: string,
  provider: LLMModelProvider,
  options?: {
    creator?: string;
    family?: string;
    size?: string;
  }
): Promise<LLMModel> {
  // Check if model with same identifier and provider already exists
  const existing = await getModels({
    identifier,
    provider,
  });

  if (existing.length > 0) {
    throw new ORPCError("CONFLICT", {
      message: `Model with identifier "${identifier}" already exists for provider "${provider}"`,
      status: 409,
    });
  }

  // Insert new model
  await db
    .insert(llmModels)
    .values({
      identifier,
      provider,
      creator: options?.creator,
      family: options?.family,
      size: options?.size,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();

  // Fetch and return the newly created model
  const newModels = await getModels({ identifier, provider });
  if (newModels.length === 0) {
    throw new Error("Unable to load model after creation");
  }
  return newModels[0];
}

export async function updateModel(
  id: number,
  model: Partial<LLMModel>
): Promise<LLMModel> {
  const update: Partial<typeof llmModels.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (model.identifier !== undefined) {
    update.identifier = model.identifier;
  }
  if (model.provider !== undefined) {
    update.provider = model.provider;
  }
  if (model.isEnabled !== undefined) {
    update.isEnabled = model.isEnabled;
  }
  if (model.size !== undefined) {
    update.size = model.size;
  }
  if (model.creator !== undefined) {
    update.creator = model.creator;
  }
  if (model.family !== undefined) {
    update.family = model.family;
  }

  await db.update(llmModels).set(update).where(eq(llmModels.id, id)).run();

  const updated = await getModelById(id);
  if (!updated) {
    throw new Error("Unable to load model after update");
  }
  return updated;
}

export async function syncModels(
  modelsList: { name: string; provider: LLMModelProvider }[],
  where: ModelFilter = {}
): Promise<LLMModel[]> {
  await pruneDuplicateModels();
  const dedupedIncoming = dedupeByKey(
    modelsList,
    (model) => `${model.provider}::${model.name}`
  );
  const existingModels = await getModels();
  const modelsWithInfo = dedupedIncoming.map((model) => {
    const parsedInfo = parseModelName(model.name);
    return {
      identifier: model.name,
      provider: model.provider,
      size: parsedInfo.size,
      creator: parsedInfo.creator,
      family: parsedInfo.familyName,
    };
  });

  const modelsToCreate = modelsWithInfo.filter(
    (model) =>
      !existingModels.some(
        (m) =>
          m.identifier === model.identifier && m.provider === model.provider
      )
  );

  if (modelsToCreate.length > 0) {
    await db
      .insert(llmModels)
      .values(
        modelsToCreate.map((model) => ({
          identifier: model.identifier,
          provider: model.provider,
          isEnabled: true,
          size: model.size,
          creator: model.creator,
          family: model.family,
        }))
      )
      .run();
  }

  return await getModels(where);
}

async function pruneDuplicateModels(): Promise<void> {
  await db.run(sql`
    DELETE FROM ${llmModels}
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM ${llmModels}
      GROUP BY ${llmModels.provider}, ${llmModels.identifier}
    )
  `);
}

type ModelInfo = {
  creator?: string;
  size?: string;
  familyName: string;
  rawName: string;
};

function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function parseModelName(rawName: string): ModelInfo {
  // Split by '/' to check for creator
  const parts = rawName.split("/");
  const creator = parts.length > 1 ? parts[0] : undefined;
  const nameWithSize = parts.length > 1 ? parts[1] : parts[0];

  // Extract size using regex - matches patterns like:
  // - 270m, 1.7b, 20b (number with unit)
  // - e4b (alphanumeric size indicator)
  const sizeMatch = nameWithSize.match(SIZE_REGEX);
  const size = sizeMatch ? sizeMatch[1] : undefined;

  // Extract family name by removing the size suffix
  let familyName = nameWithSize;
  if (size) {
    // Remove the size and its preceding delimiter (: or -)
    familyName = nameWithSize.replace(new RegExp(`[-:]${size}$`, "i"), "");
  }

  return {
    creator,
    size,
    familyName,
    rawName,
  };
}

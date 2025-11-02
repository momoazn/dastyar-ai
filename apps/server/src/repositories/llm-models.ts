import { and, eq } from "drizzle-orm";
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
  const existingModels = await getModels();
  const modelsWithInfo = modelsList.map((model) => {
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

type ModelInfo = {
  creator?: string;
  size?: string;
  familyName: string;
  rawName: string;
};

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

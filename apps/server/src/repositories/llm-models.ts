import { and, eq } from "drizzle-orm";
import {
  db,
  type LLMModel,
  type LLMModelProvider,
  llmModels,
} from "@/database";

type ModelFilter = Partial<{
  id: number;
  name: string;
  provider: LLMModelProvider;
  isEnabled: boolean;
}>;

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
  if (where.name !== undefined) {
    conditions.push(eq(llmModels.name, where.name));
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
  if (model.name !== undefined) {
    update.name = model.name;
  }
  if (model.provider !== undefined) {
    update.provider = model.provider;
  }
  if (model.isEnabled !== undefined) {
    update.isEnabled = model.isEnabled;
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
  const modelsToCreate = modelsList.filter(
    (model) =>
      !existingModels.some(
        (m) => m.name === model.name && m.provider === model.provider
      )
  );

  if (modelsToCreate.length > 0) {
    await db
      .insert(llmModels)
      .values(
        modelsToCreate.map((model) => ({
          name: model.name,
          provider: model.provider,
          isEnabled: true,
        }))
      )
      .run();
  }

  return await getModels(where);
}

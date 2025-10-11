import {
  type LLMModel,
  type LLMModelProvider,
  type Prisma,
  prisma,
} from '@/database';

export async function getModelById(id: number): Promise<LLMModel | null> {
  return await prisma.lLMModel.findUnique({
    where: { id },
  });
}

export async function getModelByName(name: string): Promise<LLMModel | null> {
  return await prisma.lLMModel.findFirst({
    where: { name },
  });
}

export async function getModelsByProvider(
  provider: LLMModelProvider
): Promise<LLMModel[]> {
  return await prisma.lLMModel.findMany({
    where: { provider },
  });
}

export async function createModel(model: LLMModel): Promise<LLMModel> {
  return await prisma.lLMModel.create({
    data: model,
  });
}

export async function updateModel(
  id: number,
  model: Partial<LLMModel>
): Promise<LLMModel> {
  return await prisma.lLMModel.update({
    where: { id },
    data: model,
  });
}

export async function deleteModel(id: number): Promise<void> {
  await prisma.lLMModel.delete({
    where: { id },
  });
}

export async function getModels(
  where: Prisma.LLMModelWhereInput = {}
): Promise<LLMModel[]> {
  return await prisma.lLMModel.findMany({
    where,
  });
}

export async function syncModels(
  modelsList: { name: string; provider: LLMModelProvider }[]
): Promise<void> {
  const existingModels = await getModels();
  const modelsToCreate = modelsList.filter(
    (model) =>
      !existingModels.some(
        (m) => m.name === model.name && m.provider === model.provider
      )
  );

  // Only create new models that don't exist in the database
  if (modelsToCreate.length > 0) {
    await prisma.lLMModel.createMany({
      data: modelsToCreate.map((m) => ({
        name: m.name,
        provider: m.provider,
        isEnabled: true, // Enable new models by default
      })),
    });
  }
}

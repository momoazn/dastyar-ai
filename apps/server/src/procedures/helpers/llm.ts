import { ORPCError } from "@orpc/client";
import { getModelById } from "@/repositories/llm-models";
import { acquireProviderForModel } from "@/services/ai-providers";

type WithModelProviderParams<T> = {
  modelId: number;
  notFoundMessage: string;
  handler: (params: {
    model: Awaited<ReturnType<typeof getModelById>> extends infer TModel
      ? Exclude<TModel, null>
      : never;
    providerModel: Awaited<ReturnType<typeof acquireProviderForModel>>["model"];
  }) => Promise<T>;
};

export async function withModelProviderById<T>(
  params: WithModelProviderParams<T>
): Promise<T> {
  const { modelId, notFoundMessage, handler } = params;

  const model = await getModelById(modelId);
  if (!model) {
    throw new ORPCError("MODEL_NOT_FOUND", {
      message: notFoundMessage,
      status: 400,
    });
  }

  const providerLease = await acquireProviderForModel(
    model.identifier,
    model.provider
  );

  try {
    return await handler({
      model,
      providerModel: providerLease.model,
    });
  } finally {
    providerLease.release();
  }
}

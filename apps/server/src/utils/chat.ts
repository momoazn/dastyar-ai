import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import type { MessageRole } from "@/database";
import type { MessageWithModel } from "@/repositories/threads";

export type MyUIMessage = UIMessage<
  {
    createdAt?: string;
    modelId: number;
    modelName?: string;
    status?: MessageWithModel["status"];
    threadId: number;
    updatedAt?: string;
  },
  UIDataTypes,
  UITools
>;

export const convertDbMessagesToUiMessages = (
  messages: MessageWithModel[]
): MyUIMessage[] =>
  messages.map((message) => ({
    id: message.id.toString(),
    role: message.role as MessageRole,
    parts: message.parts as UIMessagePart<UIDataTypes, UITools>[],
    metadata: {
      createdAt: message.createdAt.toISOString(),
      modelId: message.modelId,
      threadId: message.threadId,
      modelName: message.model?.identifier,
      status: message.status,
      updatedAt: message.updatedAt.toISOString(),
    },
  }));

// Regex to extract numeric value and unit from model size (e.g., "8b", "1.7b", "270m")
const MODEL_SIZE_REGEX = /^([0-9.]+)([a-z]+)$/;

export type ModelSizeCategory =
  | "minimal"
  | "compact"
  | "balanced"
  | "large"
  | "frontier";

// Categorize model based on size parameter
// Categories optimized for local models:
// <=3B (minimal), <=8B (compact), <=14B (balanced), <=34B (large), >34B (frontier)
export function getModelSizeCategory(
  modelSize: string | null | undefined
): ModelSizeCategory {
  if (!modelSize) {
    // Default to compact for unknown sizes (most common local models)
    return "compact";
  }

  const normalized = modelSize.toLowerCase().trim();

  // Extract numeric value and unit
  const match = normalized.match(MODEL_SIZE_REGEX);
  if (!match) {
    return "compact"; // Default to compact if format is unknown
  }

  const value = Number.parseFloat(match[1]);
  const unit = match[2];

  // Convert to billions for comparison
  let billions: number;
  if (unit === "m" || unit === "million") {
    billions = value / 1000;
  } else if (unit === "b" || unit === "billion") {
    billions = value;
  } else {
    return "compact"; // Default to compact for unknown units
  }

  // Categorize based on local model size distribution
  if (billions <= 3) {
    return "minimal"; // Phi-3, Qwen 2.5B, small models
  }
  if (billions <= 8) {
    return "compact"; // Llama 3 8B, Mistral 7B, Gemma 7B
  }
  if (billions <= 14) {
    return "balanced"; // Qwen 14B, Llama 2 13B
  }
  if (billions <= 34) {
    return "large"; // Qwen 32B, Yi 34B, Mixtral 8x7B
  }
  return "frontier"; // Qwen 72B, Llama 3 70B+, advanced models
}

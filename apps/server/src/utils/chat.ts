import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import type { MessageRole } from "@/database";
import type { MessageWithModel } from "@/repositories/threads";

export type MyUIMessage = UIMessage<
  { modelId: number; threadId: number; modelName?: string },
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
      modelId: message.modelId,
      threadId: message.threadId,
      modelName: message.model?.identifier,
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
// Categories: <=2B (minimal), <=7B (compact), <=13B (balanced), <=70B (large), >70B (frontier)
export function getModelSizeCategory(
  modelSize: string | null | undefined
): ModelSizeCategory {
  if (!modelSize) {
    // Default to balanced if size is unknown (conservative default)
    return "balanced";
  }

  const normalized = modelSize.toLowerCase().trim();

  // Extract numeric value and unit
  const match = normalized.match(MODEL_SIZE_REGEX);
  if (!match) {
    return "balanced"; // Default to balanced if format is unknown
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
    return "balanced"; // Default to balanced for unknown units
  }

  // Categorize based on modern model size distribution
  if (billions <= 2) {
    return "minimal"; // Phi, MobileLLM, etc.
  }
  if (billions <= 7) {
    return "compact"; // Llama 2 7B, Mistral 7B, etc.
  }
  if (billions <= 13) {
    return "balanced"; // Llama 2 13B, neural-chat, etc.
  }
  if (billions <= 70) {
    return "large"; // Llama 2 70B, Mixtral, etc.
  }
  return "frontier"; // GPT-4, Claude, Llama 405B, etc.
}

// Legacy function for backward compatibility
export function isSmallModel(modelSize: string | null | undefined): boolean {
  const category = getModelSizeCategory(modelSize);
  return category === "minimal" || category === "compact";
}

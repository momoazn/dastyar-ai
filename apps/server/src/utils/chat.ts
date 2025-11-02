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

// Determine if a model is "small" based on size parameter
// Small models: < 8B parameters (e.g., 270m, 1b, 1.7b, 3b, 7b)
// Large models: >= 8B parameters (e.g., 8b, 13b, 70b, etc.)
export function isSmallModel(modelSize: string | null | undefined): boolean {
  if (!modelSize) {
    // Default to small if size is unknown
    return true;
  }

  const normalized = modelSize.toLowerCase().trim();

  // Extract numeric value and unit
  const match = normalized.match(MODEL_SIZE_REGEX);
  if (!match) {
    return true; // Default to small if format is unknown
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
    return true; // Default to small for unknown units
  }

  // Consider models < 8B as small
  return billions < 8;
}

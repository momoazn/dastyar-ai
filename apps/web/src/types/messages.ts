/**
 * Message part types
 * Defines the structure of message parts in chat messages
 */

export type MessagePartType =
  | "text"
  | "image"
  | "reasoning"
  | "tool-call"
  | "tool-result";

export type TextPart = {
  type: "text";
  text: string;
};

export type ImagePart = {
  type: "image";
  image: string;
  mimeType?: string;
};

export type ReasoningPart = {
  type: "reasoning";
  text: string;
};

export type ToolCallPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type ToolResultPart = {
  type: "tool-result";
  toolCallId: string;
  result: unknown;
};

export type MessagePart =
  | TextPart
  | ImagePart
  | ReasoningPart
  | ToolCallPart
  | ToolResultPart;

export function isTextPart(part: MessagePart): part is TextPart {
  return part.type === "text";
}

export function isImagePart(part: MessagePart): part is ImagePart {
  return part.type === "image";
}

export function extractTextFromParts(parts: MessagePart[]): string {
  return parts
    .filter(isTextPart)
    .map((p) => p.text)
    .join("");
}

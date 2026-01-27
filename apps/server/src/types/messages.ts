/**
 * Server-side message part types
 * Defines the structure of message parts for server-side processing
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

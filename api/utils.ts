import type { CoreMessage } from "ai";

import { MessagesRecord } from "../src/lib/pocketbase-types";

// ===== REASONING PARSER =====
const REASONING_START_TAG = "<think>";
const REASONING_END_TAG = "</think>";

export const parseReasoningTokens = (
  content: string,
): { reasoning: string; response: string; isReasoning: boolean } => {
  let reasoning = "";
  let response = "";
  let isReasoning = false;

  // Handle progressive reasoning parsing during streaming
  const thinkStartIndex = content.indexOf(REASONING_START_TAG);

  if (thinkStartIndex !== -1) {
    isReasoning = true;
    // We found an opening <think> tag
    const thinkEndIndex = content.indexOf(REASONING_END_TAG, thinkStartIndex);

    if (thinkEndIndex !== -1) {
      // Complete reasoning block found
      const reasoningStartPos = thinkStartIndex + REASONING_START_TAG.length;
      reasoning = content.substring(reasoningStartPos, thinkEndIndex).trim();

      // Response content comes after the closing </think> tag
      const responseStartPos = thinkEndIndex + REASONING_END_TAG.length;
      response = content.substring(responseStartPos).trim();
    } else {
      // Incomplete reasoning block (still streaming reasoning)
      const reasoningStartPos = thinkStartIndex + REASONING_START_TAG.length;
      reasoning = content.substring(reasoningStartPos).trim();
      response = ""; // No response content yet
    }
  } else {
    // No reasoning tags, treat entire content as response
    response = content;
    isReasoning = false;
  }

  return { reasoning, response, isReasoning };
};

export const convertToCoreMessages = (
  messages: MessagesRecord[],
): CoreMessage[] => {
  return messages.map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content || "",
  }));
};

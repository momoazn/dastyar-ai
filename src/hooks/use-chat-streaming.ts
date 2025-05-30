import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ollama } from "ollama/browser";

import { pb } from "@/lib/pocketbase";
import {
  MessagesRecord,
  MessagesRoleOptions,
  MessagesStatusOptions,
} from "@/lib/pocketbase-types";

// ===== CONSTANTS =====
const MESSAGES_QUERY_LIMIT = 100;
const ERROR_MESSAGE = "Sorry, an error occurred while generating the response.";
const REASONING_START_TAG = "<think>";
const REASONING_END_TAG = "</think>";

// ===== TYPES =====
type CreateMessagePayload = Pick<
  MessagesRecord,
  "content" | "role" | "thread" | "model" | "status" | "reasoning" | "sent_at"
>;

type OllamaMessage = {
  role: "user" | "assistant";
  content: string;
};

type StreamingState = {
  isReasoning: boolean;
  reasoningContent: string;
  responseContent: string;
  fullContent: string;
};

// ===== UTILITY FUNCTIONS =====
const generateMessageId = (prefix: string) => {
  return `${prefix}-${Date.now()}`;
};

const createTempMessage = (
  id: string,
  role: MessagesRoleOptions,
  content: string,
  threadId: string,
  model: string,
  status: MessagesStatusOptions,
): MessagesRecord => ({
  id,
  role,
  content,
  thread: threadId,
  created: new Date().toISOString(),
  model,
  status,
});

const convertToOllamaMessages = (
  messages: MessagesRecord[],
): OllamaMessage[] => {
  return messages.map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content || "",
  }));
};

// ===== REASONING PARSER =====
const parseReasoningTokens = (
  content: string,
): { reasoning: string; response: string } => {
  let reasoning = "";
  let response = "";

  // Extract reasoning content between <think> and </think> tags
  const reasoningMatch = content.match(
    new RegExp(`${REASONING_START_TAG}([\\s\\S]*?)${REASONING_END_TAG}`, "g"),
  );

  if (reasoningMatch) {
    // Extract all reasoning blocks and combine them
    reasoning = reasoningMatch
      .map((match) =>
        match.replace(REASONING_START_TAG, "").replace(REASONING_END_TAG, ""),
      )
      .join("\n")
      .trim();

    // Remove reasoning tags from content to get the actual response
    response = content
      .replace(
        new RegExp(`${REASONING_START_TAG}[\\s\\S]*?${REASONING_END_TAG}`, "g"),
        "",
      )
      .trim();
  } else {
    // No reasoning tokens, treat entire content as response
    response = content;
  }

  return { reasoning, response };
};

const updateStreamingState = (
  currentState: StreamingState,
  newChunk: string,
): StreamingState => {
  const updatedFullContent = currentState.fullContent + newChunk;
  const { reasoning, response } = parseReasoningTokens(updatedFullContent);

  // Determine if we're currently in reasoning mode
  const isCurrentlyReasoning =
    updatedFullContent.includes(REASONING_START_TAG) &&
    !updatedFullContent.includes(REASONING_END_TAG);

  return {
    isReasoning: isCurrentlyReasoning,
    reasoningContent: reasoning,
    responseContent: response,
    fullContent: updatedFullContent,
  };
};

// ===== OLLAMA CLIENT =====
const ollama = new Ollama();

// ===== MAIN HOOK =====
export function useStreamingChat(threadId?: string) {
  // ===== STATE MANAGEMENT =====
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [tempMessages, setTempMessages] = useState<MessagesRecord[]>([]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // ===== API QUERIES & MUTATIONS =====
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () =>
      pb.collection("messages").getList(1, MESSAGES_QUERY_LIMIT, {
        filter: `thread = "${threadId}"`,
        sort: "created",
      }),
    enabled: !!threadId,
  });

  const { mutateAsync: createMessage } = useMutation({
    mutationFn: (message: CreateMessagePayload) => {
      return pb.collection("messages").create(message);
    },
  });

  // ===== UTILITY FUNCTIONS =====
  const updateTempMessage = useCallback(
    (messageId: string, updates: Partial<MessagesRecord>) => {
      setTempMessages((prev) => {
        const newMessages = [...prev];
        const index = newMessages.findIndex((msg) => msg.id === messageId);

        if (index !== -1) {
          newMessages[index] = { ...newMessages[index], ...updates };
        }

        return newMessages;
      });
    },
    [],
  );

  // ===== STREAMING HANDLERS =====
  const handleStreamingStart = useCallback(
    (userMessage: MessagesRecord, assistantMessage: MessagesRecord) => {
      setTempMessages((prev) => [...prev, userMessage, assistantMessage]);
      setPrompt("");
      setIsStreaming(true);

      const controller = new AbortController();
      setAbortController(controller);

      return controller;
    },
    [],
  );

  const handleStreamingChunk = useCallback(
    (
      assistantMessageId: string,
      streamingState: StreamingState,
      currentStatus: MessagesStatusOptions,
    ) => {
      updateTempMessage(assistantMessageId, {
        content: streamingState.responseContent,
        reasoning: streamingState.reasoningContent,
        status: currentStatus,
      });
    },
    [updateTempMessage],
  );

  const handleStreamingComplete = useCallback(
    async (
      assistantMessageId: string,
      finalStreamingState: StreamingState,
      threadId: string,
      model: string,
      controller: AbortController,
    ) => {
      if (
        !controller.signal.aborted &&
        finalStreamingState.responseContent.trim()
      ) {
        try {
          await createMessage({
            role: MessagesRoleOptions.assistant,
            content: finalStreamingState.responseContent,
            reasoning: finalStreamingState.reasoningContent,
            thread: threadId,
            model,
            status: MessagesStatusOptions.finished,
          });

          updateTempMessage(assistantMessageId, {
            status: MessagesStatusOptions.finished,
          });

          await refetchMessages();
        } catch (error) {
          console.error("Error saving assistant message:", error);
          handleStreamingError(assistantMessageId);
        }
      }
    },
    [createMessage, updateTempMessage, refetchMessages],
  );

  const handleStreamingError = useCallback(
    (assistantMessageId: string) => {
      updateTempMessage(assistantMessageId, {
        content: ERROR_MESSAGE,
        status: MessagesStatusOptions.errored,
      });
    },
    [updateTempMessage],
  );

  const handleStreamingCleanup = useCallback(() => {
    setIsStreaming(false);
    setAbortController(null);
  }, []);

  // ===== MAIN SEND MESSAGE FUNCTION =====
  const sendMessage = useCallback(
    async (model: string, overrideThreadId?: string) => {
      const effectiveThreadId = overrideThreadId || threadId;

      if (!prompt.trim() || !effectiveThreadId) {
        return;
      }

      // Prepare messages for Ollama
      const existingMessages = messagesData?.items || [];
      const ollamaMessages = convertToOllamaMessages(existingMessages);
      const newUserMessage: OllamaMessage = {
        role: "user",
        content: prompt.trim(),
      };
      const messagesToSend = [...ollamaMessages, newUserMessage];

      // Create temporary message objects
      const userMessageId = generateMessageId("temp-user");
      const assistantMessageId = generateMessageId("temp-assistant");

      const userMessage = createTempMessage(
        userMessageId,
        MessagesRoleOptions.user,
        prompt.trim(),
        effectiveThreadId,
        model,
        MessagesStatusOptions.idle,
      );

      const assistantMessage = createTempMessage(
        assistantMessageId,
        MessagesRoleOptions.assistant,
        "",
        effectiveThreadId,
        model,
        MessagesStatusOptions.idle,
      );

      // Start streaming
      const currentPrompt = prompt.trim();
      const controller = handleStreamingStart(userMessage, assistantMessage);

      // Initialize streaming state
      let streamingState: StreamingState = {
        isReasoning: false,
        reasoningContent: "",
        responseContent: "",
        fullContent: "",
      };

      try {
        // Save user message to database immediately
        await createMessage({
          role: MessagesRoleOptions.user,
          content: currentPrompt,
          thread: effectiveThreadId,
          model,
          status: MessagesStatusOptions.idle,
        });

        // Start Ollama streaming
        const streamResult = await ollama.chat({
          model,
          messages: messagesToSend,
          stream: true,
        });

        // Process streaming chunks
        for await (const chunk of streamResult) {
          if (controller.signal.aborted) {
            break;
          }

          // Update streaming state with new chunk
          streamingState = updateStreamingState(
            streamingState,
            chunk.message.content,
          );

          // Determine current status based on streaming state
          let currentStatus = MessagesStatusOptions.streaming;
          if (streamingState.isReasoning) {
            currentStatus = MessagesStatusOptions.reasoning;
          } else if (streamingState.responseContent) {
            currentStatus = MessagesStatusOptions.streaming;
          }

          // Update UI with current state
          handleStreamingChunk(
            assistantMessageId,
            streamingState,
            currentStatus,
          );
        }

        // Complete streaming
        await handleStreamingComplete(
          assistantMessageId,
          streamingState,
          effectiveThreadId,
          model,
          controller,
        );
      } catch (error) {
        console.error("Error during streaming:", error);
        handleStreamingError(assistantMessageId);
      } finally {
        handleStreamingCleanup();
      }
    },
    [
      prompt,
      threadId,
      messagesData?.items,
      handleStreamingStart,
      createMessage,
      handleStreamingChunk,
      handleStreamingComplete,
      handleStreamingError,
      handleStreamingCleanup,
    ],
  );

  // ===== STREAMING CONTROL =====
  const stopStreaming = useCallback(() => {
    if (abortController) {
      abortController.abort();
      handleStreamingCleanup();
    }
  }, [abortController, handleStreamingCleanup]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (messagesData?.items) {
      setTempMessages(messagesData.items);
    }
  }, [messagesData]);

  // ===== RETURN INTERFACE =====
  return {
    // State
    prompt,
    isStreaming,
    messages: tempMessages,

    // Actions
    setPrompt,
    sendMessage,
    stopStreaming,
  } as const;
}

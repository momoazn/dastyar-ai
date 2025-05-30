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
const UPDATE_INTERVAL_MS = 100; // Update assistant message every 100ms for real-time feel

// ===== TYPES =====
type CreateMessagePayload = Pick<
  MessagesRecord,
  "content" | "role" | "thread" | "model" | "status"
> & {
  reasoning?: string;
  sent_at?: string;
};

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

  // Handle progressive reasoning parsing during streaming
  const thinkStartIndex = content.indexOf(REASONING_START_TAG);

  if (thinkStartIndex !== -1) {
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
  const hasOpenTag = updatedFullContent.includes(REASONING_START_TAG);
  const hasCloseTag = updatedFullContent.includes(REASONING_END_TAG);
  const isCurrentlyReasoning = hasOpenTag && !hasCloseTag;

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
  const [messages, setMessages] = useState<MessagesRecord[]>([]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

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

  // ===== POCKETBASE SUBSCRIPTION EFFECTS =====
  useEffect(() => {
    if (!threadId) return;

    let unsubscribePromise: Promise<() => void> | null = null;

    // Subscribe to all messages changes for this thread
    unsubscribePromise = pb.collection("messages").subscribe(
      "*",
      (event) => {
        const record = event.record as MessagesRecord;

        // Only handle messages from the current thread
        if (record.thread !== threadId) return;

        if (event.action === "create") {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some((msg) => msg.id === record.id);
            if (exists) return prev;

            // Insert in correct chronological order
            const newMessages = [...prev, record];
            newMessages.sort((a, b) => {
              const aTime = a.created ? new Date(a.created).getTime() : 0;
              const bTime = b.created ? new Date(b.created).getTime() : 0;
              return aTime - bTime;
            });
            return newMessages;
          });
        } else if (event.action === "update") {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === record.id ? record : msg)),
          );
        } else if (event.action === "delete") {
          setMessages((prev) => prev.filter((msg) => msg.id !== record.id));
        }
      },
      {
        filter: `thread = "${threadId}"`,
      },
    );

    // Cleanup subscription on unmount or threadId change
    return () => {
      if (unsubscribePromise) {
        unsubscribePromise
          .then((unsubscribe) => {
            unsubscribe();
          })
          .catch(console.error);
      }
    };
  }, [threadId]);

  // ===== INITIAL MESSAGES LOAD =====
  useEffect(() => {
    if (messagesData?.items) {
      setMessages(messagesData.items);
    }
  }, [messagesData]);

  // ===== STREAMING HANDLERS =====
  const handlePeriodicUpdate = useCallback(
    async (
      assistantMessageId: string,
      streamingState: StreamingState,
      currentStatus: MessagesStatusOptions,
    ) => {
      try {
        // Update the assistant message in the database
        // PocketBase subscription will automatically update the UI
        await pb.collection("messages").update(assistantMessageId, {
          content: streamingState.responseContent,
          reasoning: streamingState.reasoningContent,
          status: currentStatus,
        });
      } catch (error) {
        console.error("Error updating assistant message:", error);
      }
    },
    [],
  );

  const setupPeriodicUpdates = useCallback(
    (
      assistantMessageId: string,
      getStreamingState: () => StreamingState,
      getCurrentStatus: () => MessagesStatusOptions,
    ) => {
      const interval = setInterval(async () => {
        const streamingState = getStreamingState();
        const currentStatus = getCurrentStatus();

        if (streamingState.responseContent || streamingState.reasoningContent) {
          await handlePeriodicUpdate(
            assistantMessageId,
            streamingState,
            currentStatus,
          );
        }
      }, UPDATE_INTERVAL_MS);

      setUpdateInterval(interval);
      return interval;
    },
    [handlePeriodicUpdate],
  );

  const handleStreamingComplete = useCallback(
    async (
      assistantMessageId: string,
      finalStreamingState: StreamingState,
      controller: AbortController,
    ) => {
      if (
        !controller.signal.aborted &&
        finalStreamingState.responseContent.trim()
      ) {
        try {
          // Final update to the assistant message in database
          // PocketBase subscription will automatically update the UI
          await pb.collection("messages").update(assistantMessageId, {
            content: finalStreamingState.responseContent,
            reasoning: finalStreamingState.reasoningContent,
            status: MessagesStatusOptions.finished,
          });

          await refetchMessages();
        } catch (error) {
          console.error("Error completing assistant message:", error);
          await handleStreamingError(assistantMessageId);
        }
      }
    },
    [refetchMessages],
  );

  const handleStreamingError = useCallback(
    async (assistantMessageId: string) => {
      try {
        // Update database with error state
        // PocketBase subscription will automatically update the UI
        await pb.collection("messages").update(assistantMessageId, {
          content: ERROR_MESSAGE,
          status: MessagesStatusOptions.errored,
        });
      } catch (error) {
        console.error("Error updating message with error state:", error);
      }
    },
    [],
  );

  const handleStreamingCleanup = useCallback(() => {
    // Clear the update interval
    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }

    setIsStreaming(false);
    setAbortController(null);
  }, [updateInterval]);

  // ===== MAIN SEND MESSAGE FUNCTION =====
  const sendMessage = useCallback(
    async (model: string, overrideThreadId?: string) => {
      const effectiveThreadId = overrideThreadId || threadId;

      if (!prompt.trim() || !effectiveThreadId) {
        return;
      }

      // Prepare messages for Ollama
      const existingMessages = messages.filter(
        (msg) => msg.thread === effectiveThreadId,
      );
      const ollamaMessages = convertToOllamaMessages(existingMessages);
      const newUserMessage: OllamaMessage = {
        role: "user",
        content: prompt.trim(),
      };
      const messagesToSend = [...ollamaMessages, newUserMessage];

      // Start streaming
      const currentPrompt = prompt.trim();
      setPrompt("");
      setIsStreaming(true);

      const controller = new AbortController();
      setAbortController(controller);

      // Initialize streaming state
      let streamingState: StreamingState = {
        isReasoning: false,
        reasoningContent: "",
        responseContent: "",
        fullContent: "",
      };

      let currentStatus = MessagesStatusOptions.idle;

      try {
        // Save user message to database immediately
        // PocketBase subscription will automatically add it to UI
        await createMessage({
      role: MessagesRoleOptions.user,
          content: currentPrompt,
          thread: effectiveThreadId,
      model,
      status: MessagesStatusOptions.idle,
        });

        // Create assistant message in database immediately
        // PocketBase subscription will automatically add it to UI
        const assistantMessageResponse = await createMessage({
      role: MessagesRoleOptions.assistant,
      content: "",
          reasoning: "",
          thread: effectiveThreadId,
      model,
      status: MessagesStatusOptions.idle,
        });

        // Use the real assistant message ID from database
        const realAssistantMessageId = (assistantMessageResponse as any).id;

        // Set up periodic updates
        const interval = setupPeriodicUpdates(
          realAssistantMessageId,
          () => streamingState,
          () => currentStatus,
        );

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
          currentStatus = MessagesStatusOptions.streaming;
          if (streamingState.isReasoning) {
            currentStatus = MessagesStatusOptions.reasoning;
          } else if (streamingState.responseContent) {
            currentStatus = MessagesStatusOptions.streaming;
          }

          // The periodic updates will handle database updates
          // PocketBase subscriptions will handle UI updates
        }

        // Clear the interval before final update
        if (interval) {
          clearInterval(interval);
          setUpdateInterval(null);
        }

        // Complete streaming
        await handleStreamingComplete(
          realAssistantMessageId,
          streamingState,
          controller,
        );
      } catch (error) {
        console.error("Error during streaming:", error);
        // For errors during creation, we still need to handle properly
        // but if we don't have an assistant message ID, we'll need different handling
      } finally {
        handleStreamingCleanup();
      }
    },
    [
      prompt,
      threadId,
      messages,
      createMessage,
      setupPeriodicUpdates,
      handleStreamingComplete,
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

  // ===== RETURN INTERFACE =====
  return {
    // State
    prompt,
    isStreaming,
    messages, // Now managed by PocketBase subscriptions

    // Actions
    setPrompt,
    sendMessage,
    stopStreaming,
  } as const;
}

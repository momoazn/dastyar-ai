import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { client } from "@/lib/hono";
import { pb } from "@/lib/pocketbase";
import { MessagesRecord } from "@/lib/pocketbase-types";
import { postAndStreamSSE } from "@/lib/utils";

// ===== CONSTANTS =====
const MESSAGES_QUERY_LIMIT = 100;

// ===== MAIN HOOK =====
export function useStreamingChat(threadId?: string) {
  // ===== STATE MANAGEMENT =====
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<MessagesRecord[]>([]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // ===== API QUERIES & MUTATIONS =====
  const { data: messagesData } = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () =>
      pb.collection("messages").getList(1, MESSAGES_QUERY_LIMIT, {
        filter: `thread = "${threadId}"`,
        sort: "created",
      }),
    enabled: !!threadId,
  });

  // ===== POCKETBASE SUBSCRIPTION EFFECTS =====
  useEffect(() => {
    if (!threadId) return;

    // Subscribe to all messages changes for this thread
    console.log("subscribing to messages");
    const unsubscribePromise = pb.collection("messages").subscribe(
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
    if (messagesData?.items) setMessages(messagesData.items);
  }, [messagesData]);

  // ===== MAIN SEND MESSAGE FUNCTION =====
  const sendMessage = useCallback(
    async (model: string, overrideThreadId?: string) => {
      const effectiveThreadId = overrideThreadId || threadId;
      const currentPrompt = prompt.trim();

      if (!currentPrompt || !effectiveThreadId) {
        return;
      }

      // Start streaming
      setPrompt("");
      setIsStreaming(true);

      const controller = new AbortController();
      setAbortController(controller);

      try {
        postAndStreamSSE({
          url: client.api.chat.$url().toString(),
          body: {
            message: currentPrompt,
            threadId: effectiveThreadId,
            model,
          },
          signal: controller.signal,
          onMessage: (payload) => {
            console.log("streaming, message", payload);
          },
          onError: (error) => {
            console.error("Error during streaming:", error);
          },
          onComplete: () => {
            console.log("Streaming complete");
          },
        });
      } catch (error) {
        console.error("Error during streaming:", error);
      }
    },
    [prompt, threadId, messages],
  );

  // ===== STREAMING CONTROL =====
  const stopStreaming = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  // ===== RETURN INTERFACE =====
  return {
    // State
    prompt,
    isStreaming,
    messages,

    // Actions
    setPrompt,
    sendMessage,
    stopStreaming,
  } as const;
}

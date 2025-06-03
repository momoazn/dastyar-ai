import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "@/lib/hono";
import { pb } from "@/lib/pocketbase";
import { MessagesRecord } from "@/lib/pocketbase-types";
import { postAndStreamSSE } from "@/lib/utils";

// ===== CONSTANTS =====
const MESSAGES_QUERY_LIMIT = 100;

export function useStreamingChat(threadId?: string) {
  // ===== STATE MANAGEMENT =====
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<MessagesRecord[]>([]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  
  // ===== REFS FOR PERFORMANCE =====
  const messagesRef = useRef<MessagesRecord[]>([]);
  const isSubscribedRef = useRef(false);

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

  // ===== OPTIMIZED MESSAGE SORTING =====
  const sortMessages = useCallback((msgs: MessagesRecord[]): MessagesRecord[] => {
    return [...msgs].sort((a, b) => {
      const aTime = a.created ? new Date(a.created).getTime() : 0;
      const bTime = b.created ? new Date(b.created).getTime() : 0;
      return aTime - bTime;
    });
  }, []);

  // ===== OPTIMIZED MESSAGE HANDLERS =====
  const handleMessageCreate = useCallback((record: MessagesRecord) => {
    setMessages((prev) => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some((msg) => msg.id === record.id);
      if (exists) return prev;

      const newMessages = [...prev, record];
      return sortMessages(newMessages);
    });
  }, [sortMessages]);

  const handleMessageUpdate = useCallback((record: MessagesRecord) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === record.id ? record : msg))
    );
  }, []);

  const handleMessageDelete = useCallback((recordId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== recordId));
  }, []);

  // ===== POCKETBASE SUBSCRIPTION EFFECTS =====
  useEffect(() => {
    if (!threadId || isSubscribedRef.current) return;

    // Subscribe to all messages changes for this thread
    console.log("subscribing to messages");
    isSubscribedRef.current = true;

    const unsubscribePromise = pb.collection("messages").subscribe(
      "*",
      (event) => {
        const record = event.record as MessagesRecord;

        // Only handle messages from the current thread
        if (record.thread !== threadId) return;

        // Use separate handlers for better performance
        if (event.action === "create") {
          handleMessageCreate(record);
        } else if (event.action === "update") {
          handleMessageUpdate(record);
        } else if (event.action === "delete") {
          handleMessageDelete(record.id);
        }
      },
      {
        filter: `thread = "${threadId}"`,
      },
    );

    // Cleanup subscription on unmount or threadId change
    return () => {
      isSubscribedRef.current = false;
      if (unsubscribePromise) {
        unsubscribePromise
          .then((unsubscribe) => {
            unsubscribe();
          })
          .catch(console.error);
      }
    };
  }, [threadId, handleMessageCreate, handleMessageUpdate, handleMessageDelete]);

  // ===== INITIAL MESSAGES LOAD =====
  useEffect(() => {
    if (messagesData?.items) {
      const sortedMessages = sortMessages(messagesData.items);
      setMessages(sortedMessages);
      messagesRef.current = sortedMessages;
    }
  }, [messagesData, sortMessages]);

  // ===== SYNC MESSAGES REF =====
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

      postAndStreamSSE({
        url: client.api.chat.$url().toString(),
        body: {
          message: currentPrompt,
          threadId: effectiveThreadId,
          model,
        },
        signal: controller.signal,
        onMessage: () => {
          // Let PocketBase subscriptions handle the updates
          // This reduces direct state manipulation during streaming
        },
        onError: (error) => {
          console.error("Error during streaming:", error);
          setIsStreaming(false);
        },
        onComplete: () => {
          setIsStreaming(false);
        },
      });
    },
    [prompt, threadId],
  );

  // ===== STREAMING CONTROL =====
  const stopStreaming = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsStreaming(false);
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

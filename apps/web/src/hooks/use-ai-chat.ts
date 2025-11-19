import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { tokenAtom } from "@/atoms/auth";
import type { MyUIMessage } from "@/server/utils/chat";
import { orpc } from "@/utils/orpc";

type UseAIChatOptions = {
  threadId: number;
  onFinish?: () => void;
};

// Construct absolute URL from relative path using current origin
// Works in both dev (Vite proxy) and prod (same origin)
const getApiUrl = (): string => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/chat`;
  }
  // Fallback for SSR (shouldn't happen in this app)
  return "/api/chat";
};

/**
 * Hook for managing AI chat functionality within a thread
 */
export function useAIChat({ threadId, onFinish }: UseAIChatOptions) {
  const token = useAtomValue(tokenAtom);
  const isInitialRender = useRef(true);

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId },
    })
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: getApiUrl(),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    [token]
  );

  const { messages, status, stop, sendMessage, setMessages } =
    useChat<MyUIMessage>({
      id: threadId.toString(),
      transport,
      onFinish: () => {
        messagesQuery.refetch();
        onFinish?.();
      },
    });

  // Load existing messages on initial render
  useEffect(() => {
    if (isInitialRender.current && messagesQuery.data) {
      setMessages([...messagesQuery.data]);
      isInitialRender.current = false;
    }
  }, [messagesQuery.data, setMessages]);

  const sendPrompt = useCallback(
    (prompt: string, modelId: string) => {
      sendMessage(
        { text: prompt },
        { body: { modelId, threadId: threadId.toString() } }
      );
    },
    [sendMessage, threadId]
  );

  return {
    messages,
    status,
    stop,
    sendPrompt,
    setMessages,
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
  };
}

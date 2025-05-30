import { streamText } from "ai";
import { useEffect, useState } from "react";
import { Ollama } from "ollama/browser";

import { pb } from "@/lib/pocketbase";
import {
  MessagesRecord,
  MessagesRoleOptions,
  MessagesStatusOptions,
} from "@/lib/pocketbase-types";
import { useMutation, useQuery } from "@tanstack/react-query";

const ollama = new Ollama();

export function useStreamingChat(threadId?: string) {
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () =>
      pb.collection("messages").getList(1, 100, {
        filter: `thread = "${threadId}"`,
      }),
  });

  const [tempMessages, setTempMessages] = useState<MessagesRecord[]>([]);

  const { mutate: createMessage } = useMutation({
    mutationFn: (message: Omit<MessagesRecord, "id">) => {
      return pb.collection("messages").create(message);
    },
  });

  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  // const [abortController, setAbortController] =
  //   useState<AbortController | null>(null);

  useEffect(() => {
    if (messages?.items) {
      setTempMessages(messages.items);
    }
  }, [messages]);

  const sendMessage = async (model: string) => {
    const toSendMessages = [
      ...(messages?.items.map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })) ?? []),
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    const userMessage: MessagesRecord = {
      id: Date.now().toString(),
      role: MessagesRoleOptions.user,
      content: prompt,
      thread: threadId,
      created: new Date().toISOString(),
      model,
      status: MessagesStatusOptions.idle,
    };

    const assistantMessage: MessagesRecord = {
      id: Date.now().toString(),
      role: MessagesRoleOptions.assistant,
      content: "",
      thread: threadId,
      created: new Date().toISOString(),
      model,
      status: MessagesStatusOptions.idle,
    };

    setTempMessages((prev) => [...prev, userMessage, assistantMessage]);

    setIsStreaming(true);
    const result = await ollama.chat({
      model,
      messages: toSendMessages,
      stream: true,
    });

    for await (const chunk of result) {
      setTempMessages((prev) => {
        const newMessages = [...prev];
        const index = newMessages.findIndex(
          (message) => message.id === assistantMessage.id,
        );
        if (index !== -1) {
          newMessages[index].content =
            assistantMessage.content + chunk.message.content;
        }
        return newMessages;
      });
    }

    createMessage(assistantMessage as Omit<MessagesRecord, "id">);
    refetchMessages();

    setIsStreaming(false);
  };

  // const stopStreaming = useCallback(() => {
  //   if (abortController) {
  //     abortController.abort();
  //   }
  // }, [abortController]);

  return {
    prompt,
    setPrompt,
    sendMessage,
    // stopStreaming,
    isStreaming,
    messages: tempMessages,
  };
}

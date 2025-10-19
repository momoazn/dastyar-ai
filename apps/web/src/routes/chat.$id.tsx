import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useAtomValue } from "jotai";
import { MessageCircleIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { tokenAtom } from "@/atoms/auth";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { ChatInput, Message } from "@/components/chat";
import { ConversationScaffold } from "@/components/scaffold/conversation-scaffold";
import { useChatModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import type { MyUIMessage } from "@/server/utils/chat";
import { client, orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/chat/$id")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const { id: threadId } = useParams({ from: "/chat/$id" });
  const search = useSearch({ from: "/chat/$id" }) as { initialPrompt?: string };
  const token = useAtomValue(tokenAtom);

  const { modelId } = useChatModelSelection({ threadId: Number(threadId) });
  const isInitialRender = useRef(true);

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId: Number(threadId) },
    })
  );

  const { messages, status, stop, sendMessage, setMessages } =
    useChat<MyUIMessage>({
      id: threadId,
      transport: new DefaultChatTransport({
        api: `${import.meta.env.VITE_SERVER_URL}/api/chat`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      onFinish: () => {
        messagesQuery.refetch();
      },
    });

  const handleSendPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        return;
      }

      if (messages.length === 0) {
        try {
          await client.threads.rename({
            id: Number(threadId),
            title: trimmed.slice(0, 10),
          });
          await queryClient.invalidateQueries({
            queryKey: orpc.threads.list.queryKey(),
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to rename thread on first message", error);
        }
      }

      if (!modelId) {
        return;
      }
      sendMessage(
        { text: trimmed },
        { body: { modelId, threadId: Number(threadId) } }
      );
    },
    [messages.length, modelId, sendMessage, threadId]
  );

  // If navigated here with an initial prompt from /chat, send it once
  const hasSentInitialPromptRef = useRef(false);
  useEffect(() => {
    const p =
      typeof search?.initialPrompt === "string" ? search.initialPrompt : "";
    if (!hasSentInitialPromptRef.current && p.trim() && messages.length === 0) {
      hasSentInitialPromptRef.current = true;
      // Fire-and-forget; chat.$id already handles renaming and streaming
      handleSendPrompt(p).catch(() => {
        // eslint-disable-next-line no-console
        console.error("Failed to send initial prompt", p);
      });
    }
  }, [search, messages.length, handleSendPrompt]);

  useEffect(() => {
    if (isInitialRender.current && messagesQuery.data) {
      setMessages([...messagesQuery.data]);
      isInitialRender.current = false;
    }
  }, [messagesQuery.data, setMessages]);

  return (
    <ConversationScaffold
      conversation={
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      }
      empty={
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <MessageCircleIcon className="size-10" />
          <div className="space-y-1" dir="rtl">
            <div className="font-medium">{fa.chat.askQuestion}</div>
            <div className="text-xs">{fa.chat.askQuestionDescription}</div>
          </div>
        </div>
      }
      footer={
        <ChatInput
          handleSendPrompt={handleSendPrompt}
          isGenerating={status === "streaming" || status === "submitted"}
          stopGenerating={stop}
          threadId={Number(threadId)}
        />
      }
      isEmpty={messages.length === 0}
    />
  );
}

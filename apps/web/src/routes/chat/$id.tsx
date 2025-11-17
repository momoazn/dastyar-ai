import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { MessageCircleIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { ChatInput, Message } from "@/components/chat";
import { ConversationScaffold } from "@/components/scaffold/conversation-scaffold";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useChatInput } from "@/hooks/use-chat-input";
import { useChatModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";

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
  const threadIdNum = Number(threadId);

  const { modelId } = useChatModelSelection({ threadId: threadIdNum });
  const { messages, status, stop, sendPrompt } = useAIChat({
    threadId: threadIdNum,
  });

  const { handleSendPrompt, isGenerating } = useChatInput({
    threadId: threadIdNum,
    onSendMessage: (prompt) => {
      if (!modelId) {
        return Promise.resolve();
      }
      sendPrompt(prompt, modelId.toString());
      return Promise.resolve();
    },
  });

  // If navigated here with an initial prompt from /chat, send it once
  const hasSentInitialPromptRef = useRef(false);
  useEffect(() => {
    const p =
      typeof search?.initialPrompt === "string" ? search.initialPrompt : "";
    if (!hasSentInitialPromptRef.current && p.trim() && messages.length === 0) {
      hasSentInitialPromptRef.current = true;
      // Fire-and-forget; chat.$id already handles renaming and streaming
      handleSendPrompt(p).catch(() => {
        toast.error("ارسال پیام اولیه ناموفق بود");
      });
    }
  }, [search, messages.length, handleSendPrompt]);

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
          isGenerating={
            isGenerating || status === "streaming" || status === "submitted"
          }
          stopGenerating={stop}
          threadId={threadIdNum}
        />
      }
      isEmpty={messages.length === 0}
    />
  );
}

import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { MessageCircleIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { ChatInput, Message } from "@/components/chat";
import { ConversationScaffold } from "@/components/scaffold/conversation-scaffold";
import { Alert, AlertDescription, Button } from "@/components/ui";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useChatInput } from "@/hooks/use-chat-input";
import { useChatModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import {
  readAutoScrollByThread,
  writeAutoScrollByThread,
} from "@/lib/chat-auto-scroll";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";

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
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(() =>
    readAutoScrollByThread(threadIdNum)
  );

  const { modelId } = useChatModelSelection({ threadId: threadIdNum });
  const { messages, status, stop, sendPrompt, error, isLoading } = useAIChat({
    threadId: threadIdNum,
  });

  const { handleSendPrompt, isGenerating } = useChatInput({
    threadId: threadIdNum,
    renameOnSend: !isLoading && messages.length === 0,
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
        toast.error(fa.chat.sendMessageError);
      });
    }
  }, [search, messages.length, handleSendPrompt]);

  useEffect(() => {
    setIsAutoScrollEnabled(readAutoScrollByThread(threadIdNum));
  }, [threadIdNum]);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled((current) => {
      const next = !current;
      writeAutoScrollByThread(threadIdNum, next);
      return next;
    });
  }, [threadIdNum]);

  const renderedMessages = (
    <>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {status === "submitted" && <Loader />}
    </>
  );

  return (
    <ConversationScaffold
      banner={
        <div className="space-y-2">
          <div className="flex justify-end">
            <Button
              onClick={toggleAutoScroll}
              size="sm"
              type="button"
              variant="outline"
            >
              {isAutoScrollEnabled
                ? fa.chat.disableAutoScroll
                : fa.chat.enableAutoScroll}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription dir="rtl">
                {getErrorMessage(error, fa.chat.responseError)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      }
      conversation={
        isAutoScrollEnabled ? (
          <Conversation className="h-full">
            <ConversationContent>{renderedMessages}</ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : (
          <div className="relative h-full flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl space-y-3 px-2 pt-2 pb-6">
              {renderedMessages}
            </div>
          </div>
        )
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

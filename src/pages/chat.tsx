import { useMutation } from "@tanstack/react-query";
import { BotIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import { useModelsList, useStreamingChat } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { pb } from "@/lib/pocketbase";

export default function ChatPage() {
  // ===== URL PARAMS & NAVIGATION =====
  const { id: threadId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===== COMPONENT STATE =====
  const [chatModel, setChatModel] = useState("");

  // ===== DERIVED STATE =====
  const isNewChat = !Boolean(threadId);

  // ===== API HOOKS =====
  const { data: availableModels } = useModelsList();

  const { mutateAsync: createNewThread } = useMutation({
    mutationFn: () => {
      return pb.collection("threads").create({
        title: PERSIAN_TEXTS.navigation.newChat,
        model: chatModel,
      });
    },
  });

  // ===== SIMPLIFIED CHAT HOOK =====
  const {
    prompt,
    setPrompt,
    sendMessage,
    messages,
    isStreaming,
    stopStreaming,
  } = useStreamingChat(threadId);


  // ===== MEMOIZED VALUES =====
  const memoizedMessages = useMemo(() => messages, [messages]);
  
  // ===== UTILITY FUNCTIONS =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const determineModelToUse = useCallback(() => {
    if (!memoizedMessages) return;

    // Priority 1: Use model from the last message in the thread
    const lastMessageModel = memoizedMessages.at(-1)?.model;
    if (lastMessageModel && lastMessageModel !== chatModel) {
      setChatModel(lastMessageModel);
      return;
    }

    // Priority 2: Use first available model as fallback
    if (availableModels?.length && !chatModel) {
      const firstModel = availableModels[0]?.name;
      if (firstModel) {
        setChatModel(firstModel);
      }
    }
  }, [memoizedMessages, availableModels, chatModel]);

  const createNewThreadIfNeeded = useCallback(async (): Promise<
    string | null
  > => {
    let effectiveThreadId = threadId;
    if (effectiveThreadId) return effectiveThreadId;
    try {
      const newThread = await createNewThread();
      if (!newThread.id) throw new Error("Failed to create chat thread");

      effectiveThreadId = newThread.id;
      navigate(`/chat/${effectiveThreadId}`, { replace: true });
      return effectiveThreadId;
    } catch (error) {
      console.error("Failed to create new thread:", error);
      return null;
    }
  }, [createNewThread, navigate, threadId]);

  // ===== MESSAGE HANDLING =====
  const handleSendMessage = useCallback(async () => {
    if (!prompt.trim() || !chatModel) return;

    const effectiveThreadId = await createNewThreadIfNeeded();
    if (!effectiveThreadId) return;

    await sendMessage(chatModel, effectiveThreadId);
  }, [chatModel, createNewThreadIfNeeded, sendMessage, prompt]);


  // ===== OPTIMIZED EFFECTS =====
  // Only scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [memoizedMessages, scrollToBottom]);

  // Only determine model when necessary
  useEffect(() => {
    determineModelToUse();
  }, [determineModelToUse]);

  // ===== MEMOIZED RENDER HELPERS =====
  const renderMessages = useMemo(() => {
    if (memoizedMessages.length > 0) {
      // Existing chat
      return (
        <div className="space-y-0">
          {memoizedMessages.map((message, index) => {
            return (
              <Message
                key={message.id || `streaming-${index}`}
                message={message}
              />
            );
          })}
        </div>
      );
    }

    // Existing chat, streaming
    if (!isNewChat && isStreaming) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-sm">
              {PERSIAN_TEXTS.general.loading}...
            </span>
          </div>
        </div>
      );
    }

    // New chat, not streaming
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="bg-muted mx-auto mb-4 h-16 w-16 rounded-full p-4">
            <BotIcon className="text-muted-foreground h-full w-full" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            {PERSIAN_TEXTS.chat.askQuestion}
          </h3>
          <p className="text-muted-foreground text-sm">
            {PERSIAN_TEXTS.chat.askQuestionDescription}
          </p>
        </div>
      </div>
    );
  }, [memoizedMessages, isNewChat, isStreaming]);

  // ===== MAIN RENDER =====
  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-4xl px-6 py-8 pb-32">
            {renderMessages}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input Area */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-50 backdrop-blur">
        <ChatInput
          prompt={prompt}
          setPrompt={setPrompt}
          handleSendPrompt={handleSendMessage}
          chatModel={chatModel}
          setChatModel={setChatModel}
          isStreaming={isStreaming}
          stopStreaming={stopStreaming}
        />
      </div>
    </div>
  );
}

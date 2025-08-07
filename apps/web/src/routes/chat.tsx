import { BotIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Message } from "@/components/message";

export const Route = createFileRoute("/chat")({
  component: ChatRouteComponent,
});

function ChatRouteComponent() {
  // ===== COMPONENT STATE =====
  const [chatModel, setChatModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===== MOCK DATA =====
  const availableModels = [
    { name: "llama3.2" },
    { name: "mistral" },
    { name: "gemma" },
  ];

  // ===== DERIVED STATE =====
  const isNewChat = messages.length === 0;

  // ===== MEMOIZED VALUES =====
  const memoizedMessages = useMemo(() => messages, [messages]);

  // ===== UTILITY FUNCTIONS =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const determineModelToUse = useCallback(() => {
    if (!memoizedMessages) return;

    const lastMessageModel = memoizedMessages.at(-1)?.model;
    if (lastMessageModel && lastMessageModel !== chatModel) {
      setChatModel(lastMessageModel);
      return;
    }

    if (availableModels?.length && !chatModel) {
      const firstModel = availableModels[0]?.name;
      if (firstModel) {
        setChatModel(firstModel);
      }
    }
  }, [memoizedMessages, availableModels, chatModel]);

  // ===== MESSAGE HANDLING =====
  const handleSendMessage = useCallback(() => {
    if (!prompt.trim() || !chatModel) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      created: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");

    // Simulate AI response
    setIsStreaming(true);
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a mock response from the AI assistant.",
        model: chatModel,
        status: "done",
        sent_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsStreaming(false);
    }, 1000);
  }, [chatModel, prompt]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // ===== OPTIMIZED EFFECTS =====
  useEffect(() => {
    scrollToBottom();
  }, [memoizedMessages, scrollToBottom]);

  useEffect(() => {
    determineModelToUse();
  }, [determineModelToUse]);

  // ===== MEMOIZED RENDER HELPERS =====
  const renderMessages = useMemo(() => {
    if (memoizedMessages.length > 0) {
      return (
        <div className="space-y-0">
          {memoizedMessages.map((message, index) => (
            <Message
              key={message.id || `streaming-${index}`}
              message={message}
            />
          ))}
        </div>
      );
    }

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
          models={availableModels ?? []}
        />
      </div>
    </div>
  );
}

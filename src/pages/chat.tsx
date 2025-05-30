import { BotIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGetDefaultChatModel } from "@/atoms";
import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import { useModelsList, useStreamingChat } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { pb } from "@/lib/pocketbase";
import { useMutation } from "@tanstack/react-query";

export default function ChatPage() {
  const [currentChatModel, setCurrentChatModel] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const inNewChat = !Boolean(id);
  const chatThreadIdNumber = id ? Number(id) : undefined;

  // ===== API HOOKS =====
  const defaultChatModel = useGetDefaultChatModel();
  const { data: models } = useModelsList();

  const { mutateAsync: createChatThread } = useMutation({
    mutationFn: () => {
      return pb.collection("threads").create({
        title: PERSIAN_TEXTS.navigation.newChat,
        model: currentChatModel,
      });
    },
  });

  const { prompt, setPrompt, sendMessage, isStreaming, messages } =
    useStreamingChat(chatThreadIdNumber?.toString());

  ///////////////////////////

  ///////////////////////////

  // ===== UTILS =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const determineModelToUse = useCallback(() => {
    if (!messages) return;

    const threadMessages = messages;
    const lastMessageModel = threadMessages.at(-1)?.model;

    if (lastMessageModel) {
      // Use model from the last message in the thread
      setCurrentChatModel(lastMessageModel);
    } else if (defaultChatModel) {
      // Use default model from user preferences
      setCurrentChatModel(defaultChatModel);
    } else if (models?.length) {
      // Fallback to first available model
      const firstModel = models[0]?.name;
      if (firstModel) {
        setCurrentChatModel(firstModel);
      }
    }
  }, [messages, defaultChatModel, models]);

  useEffect(() => {
    scrollToBottom();
    determineModelToUse();
  }, [determineModelToUse]);

  /**
   * Handles sending a new message
   */
  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || !currentChatModel) return;

    let threadId = chatThreadIdNumber?.toString();

    // Create a new thread if we're in a new chat
    if (!threadId) {
      try {
        const newChatThread = await createChatThread();

        if (newChatThread.id) {
          threadId = newChatThread.id.toString();
          navigate(`/chat/${newChatThread.id}`, { replace: true });
        } else {
          throw new Error("Failed to create chat thread");
        }
      } catch (error) {
        console.error("Failed to create new thread:", error);
        return;
      }
    }

    sendMessage(currentChatModel);
  }, [
    prompt,
    currentChatModel,
    chatThreadIdNumber,
    createChatThread,
    navigate,
  ]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat Messages Container - Seamless design */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-4xl px-6 py-8 pb-32">
            {messages.length && messages.length > 0 ? (
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <Message
                    key={message.id || `streaming-${index}`}
                    message={message}
                  />
                ))}
              </div>
            ) : !inNewChat && isStreaming ? (
              <div className="flex h-32 items-center justify-center">
                <div className="flex items-center gap-3">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    {PERSIAN_TEXTS.general.loading}...
                  </span>
                </div>
              </div>
            ) : (
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
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input Container - Sticky at bottom within content area */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-50 border-t backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <ChatInput
            prompt={prompt}
            setPrompt={setPrompt}
            handleSendPrompt={handleSendPrompt}
            currentChatModel={currentChatModel}
            setCurrentChatModel={setCurrentChatModel}
            isStreaming={false}
            stopStreaming={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

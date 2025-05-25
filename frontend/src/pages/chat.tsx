import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import {
  useGetModels,
  useGetChatThreadMessages,
  useCreateChatThread,
  useSendChatMessage,
} from "../../generated/apiComponents";
import { type DbMessage } from "../../generated/apiSchemas";
import { skipToken } from "@tanstack/react-query";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { useGetDefaultChatModel } from "@/atoms";

export default function ChatPage() {
  // ===== STATE =====
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [currentChatModel, setCurrentChatModel] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // ===== REFS & NAVIGATION =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const inNewChat = !Boolean(id);
  const chatThreadIdNumber = id ? Number(id) : undefined;

  // ===== API HOOKS =====
  const defaultChatModel = useGetDefaultChatModel();
  const { data: models } = useGetModels({});

  const {
    data: chatThreadMessagesData,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
  } = useGetChatThreadMessages(
    chatThreadIdNumber ? { pathParams: { id: chatThreadIdNumber.toString() } } : skipToken
  );

  const { mutateAsync: createChatThread } = useCreateChatThread();
  const sendChatMutation = useSendChatMessage();

  // ===== UTILS =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const determineModelToUse = useCallback(() => {
    if (!chatThreadMessagesData?.data) return;

    const threadMessages = chatThreadMessagesData.data;
    const lastMessageModel = threadMessages.at(-1)?.model;

    if (lastMessageModel) {
      // Use model from the last message in the thread
      setCurrentChatModel(lastMessageModel);
    } else if (defaultChatModel) {
      // Use default model from user preferences
      setCurrentChatModel(defaultChatModel);
    } else if (models?.data?.length) {
      // Fallback to first available model
      const firstModel = models.data[0]?.name;
      if (firstModel) {
        setCurrentChatModel(firstModel);
      }
    }
  }, [chatThreadMessagesData, defaultChatModel, models]);

  // ===== EFFECTS =====

  // Set initial model when first loading
  useEffect(() => {
    if (!currentChatModel) {
      if (defaultChatModel) {
        setCurrentChatModel(defaultChatModel);
      } else if (models?.data?.length) {
        const firstModel = models.data[0]?.name;
        if (firstModel) {
          setCurrentChatModel(firstModel);
        }
      }
    }
  }, [currentChatModel, defaultChatModel, models]);

  // Initialize messages when thread changes
  useEffect(() => {
    if (inNewChat || isLoadingMessages || !chatThreadMessagesData?.data) return;

    // Set messages from thread
    setMessages(chatThreadMessagesData.data);

    // Determine which chat model to use
    determineModelToUse();

    // Mark as initialized after first load
    setIsInitialized(true);

    // After loading messages, scroll to bottom
    setTimeout(scrollToBottom, 100);
  }, [
    chatThreadMessagesData,
    inNewChat,
    isLoadingMessages,
    determineModelToUse,
    scrollToBottom,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isInitialized || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isInitialized, isStreaming, scrollToBottom]);

  // ===== HANDLERS =====

  /**
   * Handles sending a new message
   */
  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || !currentChatModel) return;

    if (chatThreadIdNumber) {
      // Send to existing chat thread
      try {
        setIsStreaming(true);
        await sendChatMutation.mutateAsync({
          body: {
            content: prompt,
            model: currentChatModel,
            thread_id: chatThreadIdNumber.toString(),
          },
        });
        setPrompt("");
        refetchMessages();
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    try {
      // Create a new thread
      const newChatThread = await createChatThread({
        body: {
          title: PERSIAN_TEXTS.navigation.newChat,
          model: currentChatModel,
        },
      });

      if (newChatThread.data?.id) {
        // Send message to the new thread
        setIsStreaming(true);
        await sendChatMutation.mutateAsync({
          body: {
            content: prompt,
            model: currentChatModel,
            thread_id: newChatThread.data.id.toString(),
          },
        });
        setPrompt("");
        navigate(`/chat/${newChatThread.data.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Failed to create new thread:", error);
    } finally {
      setIsStreaming(false);
    }
  }, [
    prompt,
    currentChatModel,
    chatThreadIdNumber,
    sendChatMutation,
    createChatThread,
    navigate,
    refetchMessages,
  ]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // ===== RENDERING =====
  return (
    <main className="relative flex h-full flex-col gap-4 p-4">
      {/* Chat Messages Container */}
      <ScrollArea className="bg-background flex-1 rounded-lg">
        <section className="flex flex-col gap-4 p-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <Message key={message.id} message={message} />
            ))
          ) : !inNewChat && isLoadingMessages ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-muted-foreground animate-pulse">
                {PERSIAN_TEXTS.general.loading}...
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </section>
      </ScrollArea>

      {/* Chat Input Container */}
      <ChatInput
        prompt={prompt}
        setPrompt={setPrompt}
        handleSendPrompt={handleSendPrompt}
        currentChatModel={currentChatModel}
        setCurrentChatModel={setCurrentChatModel}
        isStreaming={isStreaming}
        stopStreaming={stopStreaming}
      />
    </main>
  );
}

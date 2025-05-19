import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import { useAIModels, useChat } from "@/lib/api";
import {
  type Message as MessageType,
  useChatThreadMessages,
  useCreateChatThread,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { useGetDefaultChatModel } from "@/atoms";

export default function ChatPage() {
  // ===== STATE =====
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [currentChatModel, setCurrentChatModel] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // ===== REFS & NAVIGATION =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const inNewChat = !Boolean(id);
  const chatThreadIdNumber = id ? Number(id) : undefined;

  // ===== API HOOKS =====
  const defaultChatModel = useGetDefaultChatModel();
  const { data: models } = useAIModels();

  const {
    data: chatThreadMessagesData,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
  } = useChatThreadMessages(chatThreadIdNumber ?? 0);

  const { mutateAsync: createChatThread } = useCreateChatThread();

  // ===== CHAT FUNCTIONALITY =====
  const { isStreaming, sendPrompt, stopStreaming } = useChat(
    { messages, setMessages },
    {
      onStreamEnd: () => {
        // Scroll to bottom when streaming ends
        scrollToBottom();
      },
    },
  );

  // ===== UTILS =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const determineModelToUse = useCallback(() => {
    if (!chatThreadMessagesData) return;

    const threadMessages = chatThreadMessagesData.data;
    const lastMessageModel = threadMessages.at(-1)?.llm;

    if (lastMessageModel) {
      // Use model from the last message in the thread
      setCurrentChatModel(lastMessageModel);
    } else if (defaultChatModel) {
      // Use default model from user preferences
      setCurrentChatModel(defaultChatModel);
    } else if (models?.data?.length) {
      // Fallback to first available model
      setCurrentChatModel(models.data[0].model);
    }
  }, [chatThreadMessagesData, defaultChatModel, models]);

  // ===== EFFECTS =====

  // Set initial model when first loading
  useEffect(() => {
    if (!currentChatModel) {
      if (defaultChatModel) {
        setCurrentChatModel(defaultChatModel);
      } else if (models?.data?.length) {
        setCurrentChatModel(models.data[0].model);
      }
    }
  }, [currentChatModel, defaultChatModel, models]);

  // Initialize messages when thread changes
  useEffect(() => {
    if (inNewChat || isLoadingMessages || !chatThreadMessagesData) return;

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
      sendPrompt(prompt, chatThreadIdNumber, currentChatModel, refetchMessages);
      setPrompt("");
      return;
    }

    try {
      // Create a new thread
      const { data: newChatThread } = await createChatThread({
        title: PERSIAN_TEXTS.navigation.newChat,
      });

      // Send message to the new thread
      sendPrompt(prompt, newChatThread.id, currentChatModel, () =>
        navigate(`/chat/${newChatThread.id}`, { replace: true }),
      );
      setPrompt("");
    } catch (error) {
      console.error("Failed to create new thread:", error);
      // Could add user notification here
    }
  }, [
    prompt,
    currentChatModel,
    chatThreadIdNumber,
    sendPrompt,
    createChatThread,
    navigate,
    refetchMessages,
  ]);

  // ===== RENDERING =====
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Chat Messages Container */}
      <ScrollArea className="bg-background flex-1 rounded-lg">
        <div className="flex flex-col gap-4 p-4">
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
        </div>
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
    </div>
  );
}

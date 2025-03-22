import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGetChatModel } from "@/atoms";
import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import { useChat } from "@/hooks";
import {
  type ChatMessage as ChatMessageType,
  useChatModels,
  useCreateChatThread,
  useChatThreadMessages,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

export function ChatPage() {
  // ===== STATE =====
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentChatModel, setCurrentChatModel] = useState("");

  // ===== REFS & NAVIGATION =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { threadID } = useParams();
  const navigate = useNavigate();

  // ===== API HOOKS =====
  const defaultChatModel = useGetChatModel();
  const { data: chatModels } = useChatModels();
  const { data: threadMessages, refetch: refetchMessages } = useChatThreadMessages(
    Number(threadID),
    { enabled: !!threadID },
  );
  const { mutateAsync: createThread } = useCreateChatThread();

  // ===== CHAT FUNCTIONALITY =====
  const { isStreaming, sendPrompt, stopStreaming } = useChat(
    messages,
    setMessages,
    {
      onStreamEnd: () => {
        // Scroll to bottom when streaming ends
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      },
    },
  );

  // ===== EFFECTS =====

  // Initialize chat model and load messages when thread changes
  useEffect(() => {
    if (!threadMessages) return;

    // Set messages from thread
    setMessages(threadMessages.data);

    // Determine which chat model to use
    const lastMessageModel = threadMessages.data.at(-1)?.model;

    if (lastMessageModel) {
      // Use model from the last message in the thread
      setCurrentChatModel(lastMessageModel);
    } else if (defaultChatModel) {
      // Use default model from user preferences
      setCurrentChatModel(defaultChatModel);
    } else if (chatModels?.data?.length) {
      // Fallback to first available model
      setCurrentChatModel(chatModels.data[0].model);
    }
  }, [threadMessages, defaultChatModel, chatModels]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set initial model when first loading
  useEffect(() => {
    if (!currentChatModel && defaultChatModel) {
      setCurrentChatModel(defaultChatModel);
    } else if (!currentChatModel && chatModels?.data?.length) {
      setCurrentChatModel(chatModels.data[0].model);
    }
  }, [currentChatModel, defaultChatModel, chatModels]);

  // ===== HANDLERS =====

  /**
   * Handles sending a new message
   */
  const handleSendPrompt = async () => {
    if (!prompt.trim() || !currentChatModel) return;

    if (threadID) {
      // Send to existing thread
      sendPrompt(prompt, Number(threadID), currentChatModel, refetchMessages);
      setPrompt("");
      return;
    }

    try {
      // Create a new thread
      const { data: newThread } = await createThread(
        PERSIAN_TEXTS.navigation.newChat,
      );

      // Send message to the new thread
      sendPrompt(prompt, newThread.id, currentChatModel, () =>
        navigate(`/threads/${newThread.id}/chat`, { replace: true }),
      );
      setPrompt("");
    } catch (error) {
      console.error("Failed to create new thread:", error);
      // Could add user notification here
    }
  };

  // ===== RENDERING =====
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Chat Messages Container */}
      <ScrollArea className="flex-1 rounded-lg bg-background">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input Container */}
      <ChatInput
        handleSendPrompt={handleSendPrompt}
        isStreaming={isStreaming}
        stopStreaming={stopStreaming}
        currentChatModel={currentChatModel}
        setCurrentChatModel={setCurrentChatModel}
        prompt={prompt}
        setPrompt={setPrompt}
      />
    </div>
  );
}

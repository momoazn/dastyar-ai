import { useEffect, useRef, useState } from "react";
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

  // ===== REFS & NAVIGATION =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatThreadID } = useParams();
  const navigate = useNavigate();

  const inNewChat = !Boolean(chatThreadID);

  // ===== API HOOKS =====
  const defaultChatModel = useGetDefaultChatModel();
  const { data: aiModels } = useAIModels();
  const { data: chatThreadMessages, refetch: refetchMessages } =
    useChatThreadMessages(Number(chatThreadID), {
      enabled: !inNewChat,
    });
  const { mutateAsync: createChatThread } = useCreateChatThread();

  // ===== CHAT FUNCTIONALITY =====
  const { isStreaming, sendPrompt, stopStreaming } = useChat(
    { messages, setMessages },
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
    if (!chatThreadMessages || inNewChat) return;

    // Set messages from thread
    setMessages(chatThreadMessages.data);

    // Determine which chat model to use
    const lastMessageModel = chatThreadMessages.data.at(-1)?.llm;

    if (lastMessageModel) {
      // Use model from the last message in the thread
      setCurrentChatModel(lastMessageModel);
    } else if (defaultChatModel) {
      // Use default model from user preferences
      setCurrentChatModel(defaultChatModel);
    } else if (aiModels?.data?.length) {
      // Fallback to first available model
      setCurrentChatModel(aiModels.data[0].model);
    }
  }, [chatThreadMessages, defaultChatModel, aiModels]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set initial model when first loading
  useEffect(() => {
    if (!currentChatModel && defaultChatModel) {
      setCurrentChatModel(defaultChatModel);
    } else if (!currentChatModel && aiModels?.data?.length) {
      setCurrentChatModel(aiModels.data[0].model);
    }
  }, [currentChatModel, defaultChatModel, aiModels]);

  // ===== HANDLERS =====

  /**
   * Handles sending a new message
   */
  const handleSendPrompt = async () => {
    if (!prompt.trim() || !currentChatModel) return;

    if (chatThreadID) {
      // Send to existing chat thread
      sendPrompt(
        prompt,
        Number(chatThreadID),
        currentChatModel,
        refetchMessages,
      );
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
  };

  // ===== RENDERING =====
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Chat Messages Container */}
      <ScrollArea className="bg-background flex-1 rounded-lg">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
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

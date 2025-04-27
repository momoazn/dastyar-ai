import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGetChatModel } from "@/atoms";
import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import { useChat } from "@/hooks";
import { useAIModels } from "@/lib/api";
import {
  type Message as MessageType,
  useConversationMessages,
  useCreateConversation,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

export default function ChatPage() {
  // ===== STATE =====
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [currentChatModel, setCurrentChatModel] = useState("");

  // ===== REFS & NAVIGATION =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversationID } = useParams();
  const navigate = useNavigate();

  // ===== API HOOKS =====
  const defaultChatModel = useGetChatModel();
  const { data: aiModels } = useAIModels();
  const { data: conversationMessages, refetch: refetchMessages } =
    useConversationMessages(Number(conversationID), {
      enabled: !!conversationID,
    });
  const { mutateAsync: createConversation } = useCreateConversation();

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
    if (!conversationMessages) return;

    // Set messages from thread
    setMessages(conversationMessages.data);

    // Determine which chat model to use
    const lastMessageModel = conversationMessages.data.at(-1)?.ai_model;

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
  }, [conversationMessages, defaultChatModel, aiModels]);

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

    if (conversationID) {
      // Send to existing conversation
      sendPrompt(
        prompt,
        Number(conversationID),
        currentChatModel,
        refetchMessages,
      );
      setPrompt("");
      return;
    }

    try {
      // Create a new thread
      const { data: newConversation } = await createConversation({
        title: PERSIAN_TEXTS.navigation.newChat,
      });

      // Send message to the new thread
      sendPrompt(prompt, newConversation.id, currentChatModel, () =>
        navigate(`/conversation/${newConversation.id}`, { replace: true }),
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

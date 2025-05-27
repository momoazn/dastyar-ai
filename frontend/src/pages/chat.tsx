import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, BotIcon } from "lucide-react";

import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import {
  useGetModels,
  useGetChatThreadMessages,
  useCreateChatThread,
} from "../../generated/apiComponents";
import { type DbMessage } from "../../generated/apiSchemas";
import { skipToken } from "@tanstack/react-query";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { useGetDefaultChatModel } from "@/atoms";
import { useStreamingChat } from "@/hooks";

// Utility function to generate temporary IDs for optimistic updates
const generateTempId = () => Date.now() + Math.floor(Math.random() * 1000);

// Utility function to check if a message is optimistic (has temporary ID)
const isOptimisticMessage = (msg: DbMessage) => {
  return typeof msg.id === 'number' && msg.id > Date.now() - 60000; // Messages created in last minute with timestamp-based IDs
};

export default function ChatPage() {
  // ===== STATE =====
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [currentChatModel, setCurrentChatModel] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<DbMessage | null>(null);

  // ===== REFS & NAVIGATION =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const inNewChat = !Boolean(id);
  const chatThreadIdNumber = id ? Number(id) : undefined;

  // ===== API HOOKS =====
  const defaultChatModel = useGetDefaultChatModel();
  const { data: models } = useGetModels({});
  const { sendMessage, stopStreaming, isStreaming } = useStreamingChat();

  const {
    data: chatThreadMessagesData,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
  } = useGetChatThreadMessages(
    chatThreadIdNumber ? { pathParams: { id: chatThreadIdNumber.toString() } } : skipToken
  );

  const { mutateAsync: createChatThread } = useCreateChatThread();

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

    // Set messages from thread, but only if we don't have any local optimistic messages
    // This prevents overriding messages that were added optimistically during streaming
    setMessages(prev => {
      const dbMessages = chatThreadMessagesData.data;
      if (!dbMessages) return prev;

      // If we have optimistic messages (with temporary IDs), merge them with database messages
      const hasOptimisticMessages = prev.some(msg => isOptimisticMessage(msg));
      
      if (hasOptimisticMessages) {
        // Keep optimistic messages and only add new database messages that aren't duplicated
        const lastDbMessage = dbMessages[dbMessages.length - 1];
        
        // If the last database message is newer than our optimistic messages, replace all with DB messages
        if (lastDbMessage && lastDbMessage.sent_at) {
          const lastDbTime = new Date(lastDbMessage.sent_at).getTime();
          const optimisticTimes = prev
            .filter(msg => isOptimisticMessage(msg))
            .map(msg => new Date(msg.sent_at || '').getTime());
          
          const latestOptimistic = Math.max(...optimisticTimes);
          
          if (lastDbTime > latestOptimistic) {
            return dbMessages;
          }
        }
        
        return prev; // Keep optimistic messages
      } else {
        return dbMessages;
      }
    });

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
  }, [messages, streamingMessage, isInitialized, isStreaming, scrollToBottom]);

  // ===== HANDLERS =====

  /**
   * Handles sending a new message
   */
  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || !currentChatModel) return;

    let threadId = chatThreadIdNumber?.toString();

    // Create a new thread if we're in a new chat
    if (!threadId) {
      try {
        const newChatThread = await createChatThread({
          body: {
            title: PERSIAN_TEXTS.navigation.newChat,
            model: currentChatModel,
          },
        });

        if (newChatThread.data?.id) {
          threadId = newChatThread.data.id.toString();
          navigate(`/chat/${newChatThread.data.id}`, { replace: true });
        } else {
          throw new Error("Failed to create chat thread");
        }
      } catch (error) {
        console.error("Failed to create new thread:", error);
        return;
      }
    }

    // Create user message object and display it immediately
    const userMessage: DbMessage = {
      id: generateTempId(), // Temporary ID for immediate display
      chat_thread_id: threadId ? parseInt(threadId) : 0,
      role: "user",
      content: prompt,
      model: currentChatModel,
      sent_at: new Date().toISOString(),
      status: "done",
    };

    // Clear the prompt and add user message to display immediately
    const messageContent = prompt;
    setPrompt("");
    setMessages(prev => [...prev, userMessage]);

    // Create initial assistant message
    const initialAssistantMessage: DbMessage = {
      id: generateTempId(), // Temporary ID
      chat_thread_id: threadId ? parseInt(threadId) : 0,
      role: "assistant",
      content: "",
      reasoning: "",
      model: currentChatModel,
      sent_at: new Date().toISOString(),
      status: "idle",
    };

    // Set initial streaming message
    setStreamingMessage(initialAssistantMessage);

    // Send the streaming message
    try {
      await sendMessage(
        {
          content: messageContent,
          model: currentChatModel,
          thread_id: threadId,
        },
        {
          onMessageUpdate: (message) => {
            setStreamingMessage(prev => {
              if (!prev) {
                return message;
              }
              
              // Accumulate the content and reasoning incrementally
              return {
                ...message, // Use the latest message properties (status, timestamps, etc.)
                content: (prev.content || "") + (message.content || ""),
                reasoning: message.reasoning || prev.reasoning || "",
              };
            });
          },
          onComplete: () => {
            setStreamingMessage(null);
            // Replace optimistic messages with final database messages
            setTimeout(() => {
              refetchMessages();
            }, 100);
          },
          onError: (error) => {
            console.error("Streaming error:", error);
            setStreamingMessage(null);
            // Restore the prompt if sending failed
            setPrompt(messageContent);
            // Remove the user message we added optimistically
            setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
          },
        }
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore the prompt if sending failed
      setPrompt(messageContent);
      // Remove the user message we added optimistically
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setStreamingMessage(null);
    }
  }, [
    prompt,
    currentChatModel,
    chatThreadIdNumber,
    sendMessage,
    createChatThread,
    navigate,
    refetchMessages,
  ]);

  // ===== RENDERING =====

  // Combine regular messages with streaming message, avoiding duplicates
  const allMessages = [...messages];
  if (streamingMessage) {
    // Only add streaming message if it's not already in the messages array
    const existingMessage = messages.find(msg => 
      msg.role === "assistant" && 
      msg.chat_thread_id === streamingMessage.chat_thread_id &&
      msg.id === streamingMessage.id
    );
    
    if (!existingMessage) {
      allMessages.push(streamingMessage);
    } else {
      // Replace the existing message with the streaming version
      const index = allMessages.findIndex(msg => msg.id === existingMessage.id);
      if (index !== -1) {
        allMessages[index] = streamingMessage;
      }
    }
  }

  return (
    <main className="flex h-full flex-col gap-4">
      {/* Chat Messages Container */}
      <div className="bg-card rounded-md border shadow-sm flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <section className="flex flex-col gap-4 p-4">
            {allMessages.length > 0 ? (
              allMessages.map((message, index) => (
                <Message key={message.id || `streaming-${index}`} message={message} />
              ))
            ) : !inNewChat && isLoadingMessages ? (
              <div className="flex h-32 items-center justify-center">
                <div className="flex items-center gap-3 rounded-md bg-muted p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-sidebar-primary" />
                  <span className="text-sm text-muted-foreground">
                    {PERSIAN_TEXTS.general.loading}...
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground mx-auto mb-4 h-16 w-16 rounded-md p-4">
                    <BotIcon className="h-full w-full" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    مکالمه جدید را شروع کنید
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    سوال خود را بپرسید تا بتوانم به شما کمک کنم
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </section>
        </ScrollArea>
      </div>

      {/* Chat Input Container */}
      <div className="bg-card rounded-md border shadow-sm">
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
    </main>
  );
}

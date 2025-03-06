import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGetChatModel } from "@/atoms";
import { ChatInput, Message } from "@/components";
import { ScrollArea } from "@/components/ui";
import { useChat } from "@/hooks";
import {
  type ChatMessage as ChatMessageType,
  useCreateThread,
  useThreadMessages,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

export function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  const defaultChatModel = useGetChatModel();

  const [currentChatModel, setCurrentChatModel] = useState<string | undefined>(
    defaultChatModel,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { threadID } = useParams();
  const navigate = useNavigate();

  const { data: threadMessages, refetch: refetchMessages } = useThreadMessages(
    Number(threadID),
    {
      enabled: !!threadID,
    },
  );

  const { isStreaming, sendMessage, stopStreaming } = useChat(
    messages,
    setMessages,
  );

  const { mutateAsync: createThread } = useCreateThread();

  useEffect(() => {
    if (threadMessages) {
      setMessages(threadMessages.data);
      const lastMessageChatModel = threadMessages.data.at(-1)?.model;
      if (lastMessageChatModel) {
        setCurrentChatModel(lastMessageChatModel);
      } else {
        setCurrentChatModel(defaultChatModel);
      }
    }
  }, [threadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (threadID) {
      sendMessage(message, Number(threadID), currentChatModel, refetchMessages);
      setMessage("");
      return;
    }

    const { data: newThread } = await createThread(
      PERSIAN_TEXTS.navigation.newChat,
    );
    sendMessage(message, newThread.id, currentChatModel, () =>
      navigate(`/threads/${newThread.id}/chat`, { replace: true }),
    );
    setMessage("");
  };

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
        handleSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        stopStreaming={stopStreaming}
        currentChatModel={currentChatModel}
        setCurrentChatModel={setCurrentChatModel}
      />
    </div>
  );
}

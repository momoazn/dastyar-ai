import { Mic, Pause, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Message } from "@/components/message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useChat } from "@/hooks/use-chat";
import {
  type Message as MessageType,
  useCreateThread,
  useThreadMessages,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

export function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);

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

  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setMessage);

  useEffect(() => {
    if (threadMessages) {
      setMessages(threadMessages.data);
    }
  }, [threadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (threadID) {
      sendMessage(message, Number(threadID), refetchMessages);
      setMessage("");
      return;
    }

    const { data: newThread } = await createThread("New Chat");
    sendMessage(message, newThread.id, () =>
      navigate(`/chat/${newThread.id}`, { replace: true }),
    );
    setMessage("");
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ScrollArea className="flex-1 rounded-lg bg-background">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={PERSIAN_TEXTS.chat.writeMessage}
          className="min-h-[40px]"
          dir={message ? detectTextDirection(message) : "rtl"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />

        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
            className="h-10 w-10"
          >
            {isRecording ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            className="h-10 w-10"
            disabled={!message.trim() || isStreaming}
            onClick={() => {
              if (isStreaming) {
                stopStreaming();
              } else {
                handleSendMessage();
              }
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

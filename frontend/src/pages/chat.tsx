import { Mic, Pause, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Message } from "@/components/message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useChat } from "@/hooks/use-chat";
import {
  type ChatMessage as ChatMessageType,
  useChatModels,
  useCreateThread,
  useThreadMessages,
} from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

export function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  const { data: chatModels } = useChatModels();
  const [currentChatModel, setCurrentChatModel] = useState<string | undefined>(
    undefined,
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

  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setMessage);

  useEffect(() => {
    if (threadMessages) {
      setMessages(threadMessages.data);
      setCurrentChatModel(threadMessages.data.at(-1)?.model);
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
      <div className="flex min-h-[80px] gap-2 rounded-md">
        <div className="flex flex-1 flex-col gap-4 rounded-md border p-2 transition-all has-[textarea:focus]:ring-2 has-[textarea:focus]:ring-ring has-[textarea:focus]:ring-offset-2">
          {/* Chat Input */}
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={PERSIAN_TEXTS.chat.writeMessage}
              className="h-full w-full resize-none rounded-none border-none focus-visible:ring-0"
              dir={message ? detectTextDirection(message) : "rtl"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>

          {/* Chat Input Buttons And Model Selector */}
          <div className="flex w-full justify-between">
            {/* Model Selector */}
            <Select
              value={currentChatModel}
              onValueChange={setCurrentChatModel}
            >
              <SelectTrigger className="w-[200px] border-none">
                <SelectValue
                  placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
                />
              </SelectTrigger>
              <SelectContent>
                {chatModels?.data?.map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chat Input Buttons */}
            <div className="flex gap-2">
              {/* Record Button */}
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

              {/* Send Button */}
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
      </div>
    </div>
  );
}

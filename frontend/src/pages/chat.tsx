import { AIMessage } from "@/components/message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useServices } from "@/context/service-context";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useModelSelection } from "@/hooks/use-model-selection";
import {
  useMessagesWithThinking,
  usePersistentChat,
} from "@/hooks/use-persistent-chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import { THINKING_MODELS } from "@/services/ollama";
import { Mic, Pause, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const isThinkingModel = (model: string) => {
  return THINKING_MODELS.find((m) => model.includes(m)) !== undefined;
};

export function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const { id } = useParams();

  const { ollamaService, selectedSession } = useServices();

  const { selectedOllamaModel } = useModelSelection();
  const { messages, isStreaming, sendMessage, stopStreaming, clearHistory } =
    usePersistentChat(ollamaService);
  const messagesWithThinking = useMessagesWithThinking(messages);
  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {messages.length > 0 && (
        <Button
          variant="outline"
          size="icon"
          onClick={clearHistory}
          className="self-end text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <ScrollArea className="flex-1 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-4">
          {(isThinkingModel(selectedOllamaModel)
            ? messagesWithThinking
            : messages
          ).map((message) => (
            <AIMessage
              key={message.timestamp}
              message={message}
              isThinkingModel={isThinkingModel(selectedOllamaModel)}
            />
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
              sendMessage(message, selectedOllamaModel);
              setMessage("");
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
                sendMessage(message, selectedOllamaModel);
                setMessage("");
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

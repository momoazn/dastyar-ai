import { Mic, Pause, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useServices } from "@/context/service-context";
import { cn, detectTextDirection } from "@/lib/utils";
import { useAudioRecording } from "../hooks/use-audio-recording";
import { useModelSelection } from "../hooks/use-model-selection";
import {
  MessageWithThinking,
  useMessagesWithThinking,
  usePersistentChat,
} from "../hooks/use-persistent-chat";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

export const ChatSection = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  const { ollamaService } = useServices();
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">گفتگو</h2>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            پاک کردن تاریخچه
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-4">
          {messagesWithThinking.map((message) => (
            <AIMessage key={message.timestamp} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="پیام خود را بنویسید..."
          className="min-h-[40px] resize-none"
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
};

interface AIMessageProps {
  message: MessageWithThinking;
}

const AIMessage = ({ message }: AIMessageProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex",
        message.role === "assistant" ? "justify-start" : "justify-end",
      )}
    >
      <div
        dir={detectTextDirection(message.content)}
        className={cn(
          "max-w-[85%] space-y-2 rounded-lg p-3",
          message.role === "assistant"
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {message.role === "assistant" && (
          <div className="flex items-center justify-between">
            {!message.finishedThinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="animate-pulse">در حال فکر کردن...</span>
              </div>
            )}

            {message.think && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setCollapsed((c) => !c)}
              >
                {collapsed ? "نمایش افکار" : "پنهان کردن افکار"}
              </Button>
            )}
          </div>
        )}

        {message.think && (
          <div
            dir="ltr"
            className={cn(
              "border-l-2 border-muted pl-2 text-sm text-muted-foreground",
              collapsed && "hidden",
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.think}
            </ReactMarkdown>
          </div>
        )}

        <article
          className={cn(
            "prose max-w-none",
            message.role === "user" && "prose-invert",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

import { Mic, Pause, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useServices } from "@/context/ServiceContext";
import { detectTextDirection } from "@/lib/utils";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useModelSelection } from "../hooks/useModelSelection";
import { usePersistentChat } from "../hooks/usePersistentChat";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export const ChatSection = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  const { ollamaService, ollamaModels, whisperModels } = useServices();

  const {
    selectedOllamaModel,
    selectedWhisperModel,
    setOllamaModel,
    setWhisperModel,
  } = useModelSelection();
  const { messages, isStreaming, sendMessage, stopStreaming, clearHistory } =
    usePersistentChat(ollamaService);
  const { isRecording, startRecording, stopRecording } = useAudioRecording(
    (text) => setMessage(text),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col gap-2 pt-4">
      <div className="mx-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">گفتگو</h2>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearHistory}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="mx-4 flex-1 rounded-md border p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={`${message.timestamp}-${message.content.substring(0, 20)}`}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "assistant"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
                dir={detectTextDirection(message.content)}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="mx-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Select value={selectedOllamaModel} onValueChange={setOllamaModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select LLM model" />
            </SelectTrigger>
            <SelectContent>
              {ollamaModels?.map((model) => (
                <SelectItem key={model} value={model || "default"}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedWhisperModel} onValueChange={setWhisperModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select Whisper model" />
            </SelectTrigger>
            <SelectContent>
              {whisperModels?.map((model) => (
                <SelectItem key={model} value={model || "default"}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pb-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1"
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
            >
              {isRecording ? <Pause size={16} /> : <Mic size={16} />}
            </Button>
            <Button
              size="icon"
              onClick={() => {
                if (isStreaming) {
                  stopStreaming();
                } else {
                  sendMessage(message, selectedOllamaModel);
                  setMessage("");
                }
              }}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

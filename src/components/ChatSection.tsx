import { Mic, Pause, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OllamaService } from "../services/ollama";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useChat } from "../hooks/useChat";
import { useModelSelection } from "../hooks/useModelSelection";
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

interface ChatSectionProps {
  ollamaService: OllamaService;
  ollamaModels?: string[];
}

const detectTextDirection = (text: string): "rtl" | "ltr" => {
  const rtlRegex =
    /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text) ? "rtl" : "ltr";
};

export const ChatSection: React.FC<ChatSectionProps> = ({
  ollamaModels,
  ollamaService,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  const { selectedModel, setModel } = useModelSelection(ollamaModels);
  const { messages, isStreaming, sendMessage, stopStreaming } =
    useChat(ollamaService);
  const { isRecording, recordingTime, startRecording, stopRecording } =
    useAudioRecording((text) => setMessage(text));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col gap-2 pt-4">
      <ScrollArea className="flex-1 rounded-md border p-4 mx-4">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
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

      <div className="flex flex-col gap-2 mx-4">
        <Select value={selectedModel} onValueChange={setModel}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {ollamaModels?.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                sendMessage(message, selectedModel);
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
                  sendMessage(message, selectedModel);
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

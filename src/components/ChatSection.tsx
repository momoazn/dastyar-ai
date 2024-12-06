import { motion } from "framer-motion";
import { Mic, Pause, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OllamaService } from "../services/ollama";
import { useStore } from "../store/useStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatSection: React.FC = () => {
  const { recording, setRecording, audioLevel, ollamaModels } = useStore();
  const ollamaService = useRef(new OllamaService());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const modelSelectHandler = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("ollamaModel", model);
  };

  useEffect(() => {
    const savedModel = localStorage.getItem("ollamaModel");
    if (savedModel) setSelectedModel(savedModel);
    else setSelectedModel(ollamaModels?.[0] ?? "");
  }, [ollamaModels]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const detectTextDirection = (text: string): "rtl" | "ltr" => {
    const rtlRegex =
      /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRegex.test(text) ? "rtl" : "ltr";
  };

  const handleSend = async () => {
    if (!message.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: message.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsStreaming(true);
    setStopRequested(false);

    let streamedContent = "";
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    await ollamaService?.current.chat(
      userMessage.content,
      selectedModel,
      (token) => {
        if (stopRequested) return;
        streamedContent += token;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...assistantMessage, content: streamedContent },
        ]);
      }
    );

    setIsStreaming(false);
  };

  const handleStop = () => {
    setStopRequested(true);
    setIsStreaming(false);
  };

  return (
    <div className="p-6">
      <div className="h-[500px] overflow-y-auto mb-4 border rounded-md bg-gray-50 p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-100 ml-auto max-w-[80%]"
                : "bg-white mr-auto max-w-[80%]"
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {msg.role === "user" ? "شما" : "دستیار"}
            </p>
            <div
              className="whitespace-pre-wrap prose prose-sm max-w-none"
              dir={detectTextDirection(msg.content)}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const language =
                        className?.replace("language-", "") || "text";
                      const isInline = !className;

                      if (isInline) {
                        return (
                          <code
                            className="bg-gray-100 px-1 rounded text-black font-mono text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      return (
                        <pre className="bg-gray-100 p-3 rounded-lg shadow-sm overflow-x-auto">
                          <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
                            <span className="font-medium">{language}</span>
                          </div>
                          <code
                            className={`font-mono text-sm block text-black`}
                            {...props}
                          >
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-2 mb-4">
        <select
          value={selectedModel}
          onChange={(e) => modelSelectHandler(e.target.value)}
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {ollamaModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-md transition-colors ${
            recording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setRecording(!recording)}
        >
          <Mic className="w-5 h-5" />
        </motion.button>
        {recording && (
          <div className="flex-1 h-2 bg-gray-200 rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${audioLevel}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            className="w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="پیام خود را بنویسید..."
            dir="rtl"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => (isStreaming ? handleStop() : handleSend())}
        >
          {isStreaming ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

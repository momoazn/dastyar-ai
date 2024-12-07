import { Mic, Pause, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OllamaService } from "../services/ollama";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSectionProps {
  ollamaService: OllamaService;
  ollamaModels?: string[];
}

// Utility functions
const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

const detectTextDirection = (text: string): "rtl" | "ltr" => {
  const rtlRegex =
    /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text) ? "rtl" : "ltr";
};

export const ChatSection: React.FC<ChatSectionProps> = ({
  ollamaModels,
  ollamaService,
}) => {
  // Services

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // State
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [recording, setRecording] = useState(false);

  // Effects
  useEffect(() => {
    const savedModel = localStorage.getItem("ollamaModel");
    if (savedModel) setSelectedModel(savedModel);
    else setSelectedModel(ollamaModels?.[0] ?? "");
  }, [ollamaModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Audio Recording Handlers
  const handleRecordingStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = ({ data }) => {
        if (data.size > 0) audioChunksRef.current.push(data);
      };

      mediaRecorder.onstart = () => setRecording(true);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        setRecordingTime(formatTime(Date.now() - startTime));
      }, 1000);

      mediaRecorder.start(1000);

      return () => {
        clearInterval(timerInterval);
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      };
    } catch (error) {
      handleRecordingError(error);
    }
  };

  const handleRecordingStop = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setRecordingTime("00:00");
    }
  };

  const handleRecordingError = (error: unknown) => {
    console.error("Recording error:", error);
    setRecording(false);

    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          alert(
            "Microphone access was denied. Please allow microphone access to use this feature."
          );
          break;
        case "NotFoundError":
          alert(
            "No microphone was found. Please ensure you have a microphone connected."
          );
          break;
        default:
          alert(
            "An error occurred while trying to start recording. Please check the console for details."
          );
      }
    }
  };

  // Transcription Handler
  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Transcription failed: ${response.status} ${errorData?.detail || ""}`
        );
      }

      const { text } = await response.json();
      if (text) setMessage(text);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Failed to transcribe audio. Please try again.");
    }
  };

  // Chat Handlers
  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("ollamaModel", model);
  };

  const handleSend = async () => {
    if (!message.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: message.trim() };
    const assistantMessage: Message = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setMessage("");
    setIsStreaming(true);
    setStopRequested(false);

    let streamedContent = "";
    await ollamaService.chat(userMessage.content, selectedModel, (token) => {
      if (stopRequested) return;
      streamedContent += token;
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { ...assistantMessage, content: streamedContent },
      ]);
    });

    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                  dir={detectTextDirection(msg.content)}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm p-4 space-y-4">
        <Select value={selectedModel} onValueChange={handleModelSelect}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
            <SelectValue placeholder="انتخاب مدل" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {ollamaModels?.map((model) => (
              <SelectItem
                key={model}
                value={model}
                className="text-gray-100 focus:bg-gray-700 focus:text-gray-100"
              >
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="پیام خود را بنویسید..."
              className="resize-none min-h-[60px] pr-4 pl-24 py-3 bg-gray-800 border-gray-700 text-gray-100 focus:border-gray-600 placeholder:text-gray-500"
              dir="rtl"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className={
                  recording
                    ? "text-red-400 hover:text-red-300 hover:bg-red-950"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                }
                onClick={() =>
                  recording ? handleRecordingStop() : handleRecordingStart()
                }
              >
                {recording ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              {recordingTime !== "00:00" && recording && (
                <span className="text-sm text-gray-400">{recordingTime}</span>
              )}
              <Button
                size="icon"
                variant={isStreaming ? "secondary" : "default"}
                className={
                  isStreaming
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-blue-600 hover:bg-blue-500"
                }
                onClick={
                  isStreaming ? () => setStopRequested(true) : handleSend
                }
                disabled={!message.trim() && isStreaming}
              >
                {isStreaming ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

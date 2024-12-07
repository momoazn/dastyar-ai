import { Mic, Pause, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OllamaService } from "../services/ollama";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSectionProps {
  ollamaModels: string[];
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

export const ChatSection: React.FC<ChatSectionProps> = ({ ollamaModels }) => {
  // Services
  const ollamaService = useRef(new OllamaService());

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
    await ollamaService.current.chat(
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
            dir={detectTextDirection(msg.content)}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedModel}
          onChange={(e) => handleModelSelect(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          {ollamaModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-md resize-none"
          rows={1}
        />
        <button
          onClick={() =>
            recording ? handleRecordingStop() : handleRecordingStart()
          }
          className={`p-2 rounded-full ${
            recording ? "bg-red-500" : "bg-blue-500"
          } text-white hover:opacity-80`}
        >
          {recording ? <Pause size={20} /> : <Mic size={20} />}
        </button>
        {recordingTime !== "00:00" && recording && (
          <span className="text-sm text-gray-500">{recordingTime}</span>
        )}
        <button
          onClick={isStreaming ? () => setStopRequested(true) : handleSend}
          disabled={!message.trim() && isStreaming}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

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
  const { recording, setRecording, ollamaModels } = useStore();
  const ollamaService = useRef(new OllamaService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");

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

  const startRecording = async () => {
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      console.log("Microphone access granted, creating MediaRecorder...");
      // Use audio/wav MIME type
      const options = { mimeType: "audio/wav;codecs=MS_PCM" };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback to default format if WAV is not supported
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Received audio chunk:", event.data.size, "bytes");
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log("MediaRecorder started");
        setRecording(true);
      };

      mediaRecorder.onstop = async () => {
        console.log("MediaRecorder stopped, processing audio...");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        console.log("Audio blob created, size:", audioBlob.size, "bytes");
        await sendAudioForTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setRecording(false);
      };

      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        setRecordingTime(
          `${minutes.toString().padStart(2, "0")}:${remainingSeconds
            .toString()
            .padStart(2, "0")}`
        );
      }, 1000);

      console.log("Starting MediaRecorder...");
      mediaRecorder.start(1000); // Collect data every second

      return () => {
        clearInterval(timerInterval);
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      };
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Microphone access was denied. Please allow microphone access to use this feature."
        );
      } else if (
        error instanceof DOMException &&
        error.name === "NotFoundError"
      ) {
        alert(
          "No microphone was found. Please ensure you have a microphone connected."
        );
      } else {
        alert(
          "An error occurred while trying to start recording. Please check the console for details."
        );
      }
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setRecordingTime("00:00");
    }
  };

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      // Ensure the file has a .wav extension
      formData.append("file", audioBlob, "recording.wav");

      console.log("Sending audio for transcription...");
      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Transcription failed:", response.status, errorData);
        throw new Error(
          `Transcription failed: ${response.status} ${errorData?.detail || ""}`
        );
      }

      const data = await response.json();
      if (data.text) {
        console.log("Transcription received:", data);
        setMessage(data.text);
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      alert("Failed to transcribe audio. Please try again.");
    }
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
          onClick={() => (recording ? stopRecording() : startRecording())}
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
          onClick={isStreaming ? handleStop : handleSend}
          disabled={!message.trim() && isStreaming}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

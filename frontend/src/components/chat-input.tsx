import { Mic, Pause, Send } from "lucide-react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { useAudioRecording, useModelsList } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

interface ChatInputProps {
  handleSendPrompt: () => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  currentChatModel?: string;
  setCurrentChatModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export function ChatInput({
  handleSendPrompt,
  isStreaming,
  stopStreaming,
  currentChatModel,
  setCurrentChatModel,
  prompt,
  setPrompt,
}: ChatInputProps) {
  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setPrompt);

  const { data: models } = useModelsList();

  // Handle key presses in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        stopStreaming();
      } else {
        handleSendPrompt();
      }
    }
  };

  // Handle send/stop button click
  const handleSendButtonClick = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      handleSendPrompt();
    }
  };

  // Handle record button click
  const handleRecordButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="space-y-4 px-6 py-4">
      {/* Message Input Area */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={PERSIAN_TEXTS.chat.writeMessage}
          className="min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          dir={prompt ? detectTextDirection(prompt) : "rtl"}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        {/* Left side - Model selector */}
        <div className="flex items-center gap-3">
          <Select
            defaultValue={currentChatModel}
            value={currentChatModel}
            onValueChange={setCurrentChatModel}
          >
            <SelectTrigger className="w-[180px] border-0 bg-transparent text-sm shadow-none focus:ring-0">
              <SelectValue
                placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
              />
            </SelectTrigger>
            <SelectContent>
              {(models || []).map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Record Button */}
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "ghost"}
            onClick={handleRecordButtonClick}
            className="size-8"
          >
            {isRecording ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Send button inside input */}
          <Button
            size="icon"
            variant={isStreaming ? "destructive" : "ghost"}
            disabled={!isStreaming && !prompt.trim()}
            onClick={handleSendButtonClick}
            className="size-8"
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
  );
}

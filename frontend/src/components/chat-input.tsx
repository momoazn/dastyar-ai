import { Mic, Pause, Send, Sparkles } from "lucide-react";

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
      handleSendPrompt();
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
    <div className="space-y-4 p-4">
      {/* Message Input Area */}
      <MessageInput
        prompt={prompt}
        setPrompt={setPrompt}
        handleKeyDown={handleKeyDown}
      />

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        {/* Model Selector */}
        <ModelSelector
          currentModel={currentChatModel}
          setCurrentModel={setCurrentChatModel}
          models={models?.models || []}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Record Button */}
          <RecordButton
            isRecording={isRecording}
            onClick={handleRecordButtonClick}
          />

          {/* Send Button */}
          <SendButton
            isDisabled={!prompt.trim()}
            isStreaming={isStreaming}
            onClick={handleSendButtonClick}
          />
        </div>
      </div>
    </div>
  );
}

interface MessageInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function MessageInput({ prompt, setPrompt, handleKeyDown }: MessageInputProps) {
  return (
    <div className="relative">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={PERSIAN_TEXTS.chat.writeMessage}
        className="border-border bg-background min-h-[60px] w-full resize-none"
        dir={prompt ? detectTextDirection(prompt) : "rtl"}
        onKeyDown={handleKeyDown}
      />
      {/* Placeholder icon when empty */}
      {!prompt && (
        <div className="text-muted-foreground absolute top-4 left-4">
          <Sparkles className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

interface ModelSelectorProps {
  currentModel?: string;
  setCurrentModel: (model: string) => void;
  models: Array<{ name: string; [key: string]: any }>;
}

function ModelSelector({
  currentModel,
  setCurrentModel,
  models,
}: ModelSelectorProps) {
  return (
    <Select
      defaultValue={currentModel}
      value={currentModel}
      onValueChange={setCurrentModel}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue
          placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
        />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.name} value={model.name}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{model.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  return (
    <Button
      size="icon"
      variant={isRecording ? "destructive" : "outline"}
      onClick={onClick}
      className="h-10 w-10"
    >
      {isRecording ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}

interface SendButtonProps {
  isDisabled: boolean;
  isStreaming: boolean;
  onClick: () => void;
}

function SendButton({ isDisabled, isStreaming, onClick }: SendButtonProps) {
  return (
    <Button
      size="icon"
      variant={isStreaming ? "destructive" : "default"}
      disabled={isDisabled}
      onClick={onClick}
      className="h-10 w-10"
    >
      {isStreaming ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Send className="h-4 w-4" />
      )}
    </Button>
  );
}

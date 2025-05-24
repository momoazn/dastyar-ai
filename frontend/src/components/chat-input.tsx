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
import { useAudioRecording } from "@/hooks";
import { useAIModels } from "@/lib/api";
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

  const { data: aiModels } = useAIModels();

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
    <div className="has-[textarea:focus]:ring-ring flex min-h-[80px] flex-col gap-4 rounded-md border p-2 transition-all has-[textarea:focus]:ring-2 has-[textarea:focus]:ring-offset-2">
      {/* Message Input Area */}
      <MessageInput
        prompt={prompt}
        setPrompt={setPrompt}
        handleKeyDown={handleKeyDown}
      />

      {/* Controls Bar */}
      <div className="flex w-full justify-between">
        {/* Model Selector */}
        <ModelSelector
          currentModel={currentChatModel}
          setCurrentModel={setCurrentChatModel}
          models={aiModels?.data || []}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Record Button */}
          <RecordButton
            isRecording={isRecording}
            onClick={handleRecordButtonClick}
          />

          {/* Send Button */}
          <SendButton
            isDisabled={!prompt.trim() || isStreaming}
            onClick={handleSendButtonClick}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-components to improve readability

interface MessageInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function MessageInput({ prompt, setPrompt, handleKeyDown }: MessageInputProps) {
  return (
    <Textarea
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder={PERSIAN_TEXTS.chat.writeMessage}
      className="h-full w-full resize-none rounded-none border-none focus-visible:ring-0"
      dir={prompt ? detectTextDirection(prompt) : "rtl"}
      onKeyDown={handleKeyDown}
    />
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
      <SelectTrigger className="w-[200px] border-none">
        <SelectValue
          placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
        />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.name} value={model.name}>
            {model.name}
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
  onClick: () => void;
}

function SendButton({ isDisabled, onClick }: SendButtonProps) {
  return (
    <Button
      size="icon"
      className="h-10 w-10"
      disabled={isDisabled}
      onClick={onClick}
    >
      <Send className="h-4 w-4" />
    </Button>
  );
}

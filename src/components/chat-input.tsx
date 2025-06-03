import { memo, useCallback, useMemo } from "react";
import { Pause, Send } from "lucide-react";

import { PDFAttachment } from "@/components/pdf-attachment";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { useModelsList } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

interface ChatInputProps {
  handleSendPrompt: () => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  chatModel?: string;
  setChatModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  // PDF attachment props
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const ChatInput = memo(
  ({
    handleSendPrompt,
    isStreaming,
    stopStreaming,
    chatModel,
    setChatModel,
    prompt,
    setPrompt,
    onFileSelect,
    isUploading = false,
    uploadProgress = 0,
  }: ChatInputProps) => {
    const { data: models } = useModelsList();

    // Memoize text direction calculation
    const textDirection = useMemo(
      () => (prompt ? detectTextDirection(prompt) : "rtl"),
      [prompt],
    );

    // Handle key presses in the textarea
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (isStreaming) {
            stopStreaming();
          } else {
            handleSendPrompt();
          }
        }
      },
      [isStreaming, stopStreaming, handleSendPrompt],
    );

    // Handle send/stop button click
    const handleSendButtonClick = useCallback(() => {
      if (isStreaming) {
        stopStreaming();
      } else {
        handleSendPrompt();
      }
    }, [isStreaming, stopStreaming, handleSendPrompt]);

    // Memoize prompt change handler
    const handlePromptChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
      },
      [setPrompt],
    );

    // Memoize models list rendering
    const modelItems = useMemo(() => {
      return (models || []).map((model) => (
        <SelectItem key={model.name} value={model.name}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{model.name}</span>
          </div>
        </SelectItem>
      ));
    }, [models]);

    return (
      <div className="space-y-4 px-6 py-4">
        {/* Message Input Area */}
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder={PERSIAN_TEXTS.chat.writeMessage}
            className="min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            dir={textDirection}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between">
          {/* Left side - Model selector */}
          <div className="flex items-center gap-3">
            <Select
              defaultValue={chatModel}
              value={chatModel}
              onValueChange={setChatModel}
            >
              <SelectTrigger className="w-[180px] border-0 bg-transparent text-sm shadow-none focus:ring-0">
                <SelectValue
                  placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
                />
              </SelectTrigger>
              <SelectContent>{modelItems}</SelectContent>
            </Select>
          </div>

          {/* Right side - Send button */}
          <div className="flex items-center gap-2">
            {/* PDF Attachments */}
            <PDFAttachment
              onFileSelect={onFileSelect}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              disabled={isStreaming}
            />
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
  },
);

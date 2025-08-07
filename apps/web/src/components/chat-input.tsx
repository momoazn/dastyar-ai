import { ChevronDown, Pause, Send } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";

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
  models?: Array<{ name: string }> | string[];
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
    models = [],
  }: ChatInputProps) => {
    // models prop provided by parent
    // Memoize text direction calculation
    const textDirection = useMemo(
      () => (prompt ? detectTextDirection(prompt) : "rtl"),
      [prompt]
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
      [isStreaming, stopStreaming, handleSendPrompt]
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
      [setPrompt]
    );

    // Memoize models list rendering
    const modelItems = useMemo(() => {
      return (models || []).map((model) => {
        const value = typeof model === "string" ? model : model.name;
        const label = typeof model === "string" ? model : model.name;
        return (
          <SelectItem key={value} value={value}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{label}</span>
            </div>
          </SelectItem>
        );
      });
    }, [models]);

    return (
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="bg-muted/30 rounded-2xl border shadow-sm transition-all focus-within:shadow-md hover:shadow-md">
          {/* Message Input Area */}
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder={PERSIAN_TEXTS.chat.writeMessage}
              className="placeholder:text-muted-foreground/60 min-h-[100px] w-full resize-none border-0 bg-transparent px-6 py-4 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              dir={textDirection}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            {/* Left side - Model selector and Actions */}
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <Select
                defaultValue={chatModel}
                value={chatModel}
                onValueChange={setChatModel}
              >
                <SelectTrigger className="bg-background/50 hover:bg-background/80 h-9 gap-2 border-0 px-3 text-sm font-medium shadow-none focus:ring-0">
                  <SelectValue
                    placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
                  />
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </SelectTrigger>
                <SelectContent>{modelItems}</SelectContent>
              </Select>
            </div>

            {/* Right side - Send button */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={isStreaming ? "destructive" : "default"}
                disabled={!isStreaming && (!prompt.trim() || !chatModel)}
                onClick={handleSendButtonClick}
                className="h-9 w-9 rounded-full"
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
    );
  }
);

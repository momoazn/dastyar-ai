import { Pause, Send } from 'lucide-react';
import { memo, useMemo } from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { detectTextDirection } from '@/lib/utils';

interface ChatInputProps {
  handleSendPrompt: () => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  chatModel?: string; // `${provider}:${modelId}`
  setChatModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  models?: Array<{
    id: string;
    name: string;
    provider?: string;
  }>;
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
      () => (prompt ? detectTextDirection(prompt) : 'rtl'),
      [prompt]
    );

    // Handle key presses in the textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
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

    // Memoize prompt change handler
    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    };

    // Memoize models list rendering
    const modelItems = useMemo(() => {
      return (models || []).map((model) => {
        return (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm">{model.name}</span>
              {model.provider ? (
                <span className="text-[8px] text-muted-foreground uppercase tracking-wide">
                  {model.provider}
                </span>
              ) : null}
            </div>
          </SelectItem>
        );
      });
    }, [models]);

    return (
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="rounded-2xl border bg-muted/30 shadow-sm transition-all focus-within:shadow-md hover:shadow-md">
          {/* Message Input Area */}
          <div className="relative">
            <Textarea
              className="min-h-[100px] w-full resize-none border-0 bg-transparent px-6 py-4 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              dir={textDirection}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              placeholder={PERSIAN_TEXTS.chat.writeMessage}
              value={prompt}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            {/* Left side - Model selector and Actions */}
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <Select
                defaultValue={chatModel}
                onValueChange={setChatModel}
                value={chatModel}
              >
                <SelectTrigger className="h-9 w-80 gap-2 border-0 bg-background/50 px-3 font-medium text-sm shadow-none hover:bg-background/80 focus:ring-0">
                  <SelectValue
                    placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
                  />
                </SelectTrigger>
                <SelectContent>{modelItems}</SelectContent>
              </Select>
            </div>

            {/* Right side - Send button */}
            <div className="flex items-center gap-2">
              <Button
                className="size-9 cursor-pointer"
                disabled={!(isStreaming || (prompt.trim() && chatModel))}
                onClick={handleSendButtonClick}
                size="icon"
                variant={isStreaming ? 'destructive' : 'default'}
              >
                {isStreaming ? (
                  <Pause className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

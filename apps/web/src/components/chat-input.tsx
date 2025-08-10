import { Pause, RefreshCcw, Send } from 'lucide-react';
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
import { client, orpc, queryClient } from '@/utils/orpc';

interface ChatInputProps {
  handleSendPrompt: () => void;
  isGenerating: boolean;
  stopGenerating: () => void;
  chatModelId?: string; // `${provider}:${modelId}`
  setChatModelId: (model: string) => void;
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
    isGenerating,
    stopGenerating,
    chatModelId,
    setChatModelId,
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
        if (isGenerating) {
          stopGenerating();
        } else {
          handleSendPrompt();
        }
      }
    };

    // Handle send/stop button click
    const handleSendButtonClick = () => {
      if (isGenerating) {
        stopGenerating();
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

    const handleSyncModels = async () => {
      await client.models.sync();
      await queryClient.invalidateQueries({
        queryKey: orpc.models.list.queryKey({
          input: { isEnabled: true },
        }),
      });
    };

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
                defaultValue={chatModelId}
                onValueChange={setChatModelId}
                value={chatModelId}
              >
                <SelectTrigger className="h-9 w-80 cursor-pointer gap-2 border-0 bg-background/50 px-3 font-medium text-sm shadow-none hover:bg-background/80 focus:ring-0">
                  <SelectValue
                    placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
                  />
                </SelectTrigger>
                <SelectContent>{modelItems}</SelectContent>
              </Select>

              <Button
                className="cursor-pointer"
                onClick={handleSyncModels}
                size="icon"
                variant="outline"
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>

            {/* Right side - Send button */}
            <div className="flex items-center gap-2">
              <Button
                className="size-9 cursor-pointer"
                disabled={!(isGenerating || (prompt.trim() && chatModelId))}
                onClick={handleSendButtonClick}
                size="icon"
                variant={isGenerating ? 'destructive' : 'default'}
              >
                {isGenerating ? (
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

import { RefreshCcw } from 'lucide-react';
import { memo, useMemo } from 'react';
// no button import needed here
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
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
        return;
      }
      handleSendPrompt();
    };

    // Memoize prompt change handler
    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    };

    // Memoize models list rendering
    const modelItems = useMemo(() => {
      return (models || []).map((model) => ({
        key: model.id,
        value: model.id,
        content: (
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-sm">{model.name}</span>
            {model.provider ? (
              <span className="text-[8px] text-muted-foreground uppercase tracking-wide">
                {model.provider}
              </span>
            ) : null}
          </div>
        ),
      }));
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
      <div className="mx-auto max-w-4xl px-6 py-4" dir="rtl">
        <div className="rounded-2xl border bg-muted/30 shadow-sm transition-all focus-within:shadow-md hover:shadow-md">
          <PromptInput
            onSubmit={(e) => {
              e.preventDefault();
              handleSendButtonClick();
            }}
          >
            <PromptInputTextarea
              dir={textDirection}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              placeholder={PERSIAN_TEXTS.chat.writeMessage}
              value={prompt}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputModelSelect
                  defaultValue={chatModelId}
                  onValueChange={setChatModelId}
                  value={chatModelId}
                >
                  <PromptInputModelSelectTrigger className="h-9 w-80 cursor-pointer gap-2">
                    <PromptInputModelSelectValue
                      placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
                    />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {modelItems.map((item) => (
                      <PromptInputModelSelectItem
                        key={item.key}
                        value={item.value}
                      >
                        {item.content}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
                <PromptInputButton onClick={handleSyncModels} variant="outline">
                  <RefreshCcw className="size-4" />
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!(isGenerating || (prompt.trim() && chatModelId))}
                status={isGenerating ? 'streaming' : undefined}
                variant={isGenerating ? 'destructive' : 'default'}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    );
  }
);

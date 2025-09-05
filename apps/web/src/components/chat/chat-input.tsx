import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { modelAtom } from '@/atoms/model';
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
import { TranscribeButton } from '@/components/transcribe-button';
import { Alert, AlertDescription } from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { detectTextDirection } from '@/lib/utils';
import { orpc } from '@/utils/orpc';

interface ChatInputProps {
  handleSendPrompt: (prompt: string) => void;
  isGenerating?: boolean;
  stopGenerating?: () => void;
  lastUsedModelName?: string;
}

export const ChatInput = ({
  handleSendPrompt,
  isGenerating,
  stopGenerating,
  lastUsedModelName,
}: ChatInputProps) => {
  const [prompt, setPrompt] = useState('');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );
  const [modelId, setModelName] = useAtom(modelAtom);

  const modelsQuery = useQuery(orpc.models.list.queryOptions());

  useEffect(() => {
    if (!(modelId || lastUsedModelName) && modelsQuery.data?.[0]?.name) {
      setModelName(modelsQuery.data[0].name);
    } else if (lastUsedModelName) {
      setModelName(lastUsedModelName);
    }
  }, [modelsQuery.data, modelId, setModelName, lastUsedModelName]);

  // Handle transcription success
  const handleTranscription = (transcribedText: string) => {
    // Append transcribed text to existing prompt
    if (transcribedText.trim()) {
      setPrompt((prev) => {
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + transcribedText.trim();
      });
    }
  };

  const handleTranscriptionError = (error: string) => {
    console.error('Transcription failed:', error);
    setTranscriptionError(`خطا در تبدیل صدا به متن: ${error}`);
  };

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
        stopGenerating?.();
      } else {
        handleSendPrompt(prompt);
        setPrompt('');
      }
    }
  };

  // Handle send/stop button click
  const handleSendButtonClick = () => {
    if (isGenerating) {
      stopGenerating?.();
      return;
    }
    handleSendPrompt(prompt);
    setPrompt('');
  };

  // Memoize prompt change handler
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Memoize models list rendering
  const modelItems = useMemo(() => {
    if (modelsQuery?.isPending || !modelsQuery?.data) {
      return [];
    }

    return modelsQuery.data.map((model) => ({
      key: model.name,
      value: model.name,
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
  }, [modelsQuery?.data, modelsQuery?.isPending]);

  // Get language for transcription based on text direction
  const transcriptionLanguage = useMemo(() => {
    return prompt && detectTextDirection(prompt) === 'rtl' ? 'fa' : 'en';
  }, [prompt]);

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
            placeholder={fa.chat.writeMessage}
            value={prompt}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputModelSelect
                defaultValue={modelId as string}
                onValueChange={setModelName}
                value={modelId as string}
              >
                <PromptInputModelSelectTrigger className="h-9 w-80 cursor-pointer gap-2">
                  <PromptInputModelSelectValue
                    placeholder={fa.modelSelection.selectChatModel}
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
              <PromptInputButton
                onClick={() => modelsQuery.refetch()}
                variant="outline"
              >
                <RefreshCcw className="size-4" />
              </PromptInputButton>
            </PromptInputTools>
            <div className="flex items-center gap-2">
              <TranscribeButton
                language={transcriptionLanguage}
                onError={handleTranscriptionError}
                onTranscribed={handleTranscription}
                size="icon"
                variant="outline"
              />
              <PromptInputSubmit
                disabled={!(isGenerating || (prompt.trim() && modelId))}
                status={isGenerating ? 'streaming' : undefined}
                variant={isGenerating ? 'destructive' : 'default'}
              />
            </div>
          </PromptInputToolbar>
        </PromptInput>
      </div>
      {transcriptionError && (
        <Alert className="mt-2" variant="destructive">
          <AlertDescription dir="rtl">{transcriptionError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

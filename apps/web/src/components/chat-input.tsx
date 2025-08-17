import { useMutation } from '@tanstack/react-query';
import { Mic, RefreshCcw, Square } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui';
import {
  formatElapsed,
  type RecordingError,
  useVoiceRecorder,
} from '@/hooks/use-voice-recorder';
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
  setPrompt: (prompt: string | ((prev: string) => string)) => void;
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
    const t = PERSIAN_TEXTS.chat;

    // Voice recording hook
    const {
      isRecording,
      elapsedMs,
      startRecording,
      stopRecording,
      error: recordingError,
      recordedFile,
      clearRecordedFile,
    } = useVoiceRecorder();

    // Transcription mutation
    const { mutate: transcribe, isPending: isTranscribing } = useMutation(
      orpc.transcribe.transcribe.mutationOptions({
        onSuccess: (data) => {
          // Append transcribed text to existing prompt
          const transcribedText = data.text;
          if (transcribedText.trim()) {
            setPrompt((prev) => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + transcribedText.trim();
            });
          }
        },
        onError: () => {
          // Error will be handled by the error display logic below
        },
      })
    );

    // Handle transcription when recordedFile becomes available
    useEffect(() => {
      if (recordedFile) {
        // Detect language for transcription - default to Persian
        const language =
          prompt && detectTextDirection(prompt) === 'rtl' ? 'fa' : 'en';
        const model = language === 'fa' ? 'base' : 'tiny';
        transcribe({ file: recordedFile, language, model });
        // Clear the recorded file to prevent re-transcription
        clearRecordedFile();
      }
    }, [recordedFile, transcribe, clearRecordedFile, prompt]);

    // Map recording errors to user-friendly messages
    const mapRecordingError = (error: RecordingError): string => {
      switch (error) {
        case 'micAccessDenied':
          return PERSIAN_TEXTS.transcribe.errors.micAccess;
        case 'noAudioCaptured':
          return PERSIAN_TEXTS.transcribe.errors.noAudio;
        case 'initFailed':
        case 'processingFailed':
          return PERSIAN_TEXTS.transcribe.errors.processFailed;
        default:
          return t.voiceRecordingError;
      }
    };

    // Get display error
    const voiceError = recordingError
      ? mapRecordingError(recordingError)
      : null;

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

      // Keyboard shortcut for voice recording (Ctrl/Cmd + M)
      if (e.key === 'm' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!isMicDisabled) {
          handleMicClick();
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

    // Voice recording handlers
    const handleMicClick = async () => {
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    };

    // Get microphone button status
    const getMicButtonText = () => {
      if (isRecording) {
        return `${t.micStop} • ${formatElapsed(elapsedMs)}`;
      }
      if (isTranscribing) {
        return t.transcribingVoice;
      }
      return `${t.micStart} (Ctrl+M)`;
    };

    const isMicDisabled = isGenerating || isTranscribing;

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
              <div className="flex items-center gap-2">
                <PromptInputButton
                  className={isRecording ? 'animate-pulse' : ''}
                  disabled={isMicDisabled}
                  onClick={handleMicClick}
                  title={getMicButtonText()}
                  variant={isRecording ? 'destructive' : 'outline'}
                >
                  {isRecording ? (
                    <Square className="size-4" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                  {isRecording && (
                    <span className="ml-2 text-xs">
                      {formatElapsed(elapsedMs)}
                    </span>
                  )}
                </PromptInputButton>
                <PromptInputSubmit
                  disabled={!(isGenerating || (prompt.trim() && chatModelId))}
                  status={isGenerating ? 'streaming' : undefined}
                  variant={isGenerating ? 'destructive' : 'default'}
                />
              </div>
            </PromptInputToolbar>
          </PromptInput>
        </div>
        {voiceError && (
          <Alert className="mt-2" variant="destructive">
            <AlertDescription dir="rtl">{voiceError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

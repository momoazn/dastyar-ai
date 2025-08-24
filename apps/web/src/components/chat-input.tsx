import { useMutation } from '@tanstack/react-query';
import { Mic, RefreshCcw, Square } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';
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
import { fa } from '@/lib/persian-texts';
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
    const {
      mutate: transcribe,
      isPending: isTranscribing,
      error: transcribeError,
    } = useMutation(
      orpc.transcribe.transcribe.mutationOptions({
        onSuccess: (transcribedText) => {
          // Append transcribed text to existing prompt
          if (transcribedText.trim()) {
            setPrompt((prev) => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + transcribedText.trim();
            });
          }
          // Clear the recorded file after successful transcription
          clearRecordedFile();
        },
        onError: (error) => {
          // Error will be handled by the error display logic below
          console.error('Transcription failed:', error);
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
        transcribe({
          file: recordedFile,
          language,
          model,
        });
      }
    }, [recordedFile, transcribe, prompt]);

    // Map recording errors to user-friendly messages
    const mapRecordingError = (error: RecordingError): string => {
      switch (error) {
        case 'micAccessDenied':
          return fa.transcribe.errors.micAccess;
        case 'noAudioCaptured':
          return fa.transcribe.errors.noAudio;
        case 'fileTooLarge':
          return 'فایل ضبط شده خیلی بزرگ است. حداکثر سایز مجاز 50MB می‌باشد.';
        case 'initFailed':
        case 'processingFailed':
          return fa.transcribe.errors.processFailed;
        default:
          return fa.chat.voiceRecordingError;
      }
    };

    // Get display error
    let voiceError: string | null = null;
    if (recordingError) {
      voiceError = mapRecordingError(recordingError);
    } else if (transcribeError) {
      const errorMsg =
        transcribeError instanceof Error
          ? transcribeError.message
          : 'خطای نامشخص';
      voiceError = `خطا در تبدیل صدا به متن: ${errorMsg}`;
    }

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
        // Clear any previous errors before starting new recording
        if (recordingError || transcribeError) {
          // Reset errors by restarting the hook state
        }
        await startRecording();
      }
    };

    // Get microphone button status
    const getMicButtonText = () => {
      if (isRecording) {
        return `${fa.chat.micStop} • ${formatElapsed(elapsedMs)}`;
      }
      if (isTranscribing) {
        return fa.chat.transcribingVoice;
      }
      return `${fa.chat.micStart} (Ctrl+M)`;
    };

    const isMicDisabled = isGenerating || isTranscribing;

    // Show retry option for failed transcriptions
    const showRetryButton = recordedFile && transcribeError && !isTranscribing;

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
                  defaultValue={chatModelId}
                  onValueChange={setChatModelId}
                  value={chatModelId}
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
                <PromptInputButton onClick={handleSyncModels} variant="outline">
                  <RefreshCcw className="size-4" />
                </PromptInputButton>
              </PromptInputTools>
              <div className="flex items-center gap-2">
                {showRetryButton && (
                  <PromptInputButton
                    onClick={() => {
                      const language =
                        prompt && detectTextDirection(prompt) === 'rtl'
                          ? 'fa'
                          : 'en';
                      const model = language === 'fa' ? 'base' : 'tiny';
                      if (recordedFile) {
                        transcribe({
                          file: recordedFile,
                          language,
                          model,
                        });
                      }
                    }}
                    title={fa.chat.retryVoiceTranscription}
                    variant="outline"
                  >
                    <RefreshCcw className="size-4" />
                  </PromptInputButton>
                )}
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
                    <span className="mr-2 text-xs rtl:mr-0 rtl:ml-2">
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

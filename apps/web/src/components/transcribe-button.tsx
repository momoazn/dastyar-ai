import { useMutation, useQuery } from '@tanstack/react-query';
import { Mic, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/ui';
import {
  formatElapsed,
  type RecordingError,
  useVoiceRecorder,
} from '@/hooks/use-voice-recorder';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

interface TranscribeButtonProps {
  onTranscribed: (text: string) => void;
  onError?: (error: string) => void;
  language?: 'fa' | 'en';
  model?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  showControls?: boolean;
  onLanguageChange?: (language: 'fa' | 'en') => void;
  onModelChange?: (model: string) => void;
  availableModels?: Array<{ id: string; name: string }>;
}

export function TranscribeButton({
  onTranscribed,
  onError,
  language = 'fa',
  model = 'base',
  variant = 'outline',
  size = 'default',
  className,
  disabled = false,
  showControls = false,
  onLanguageChange,
  onModelChange,
  availableModels = [],
}: TranscribeButtonProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const {
    isRecording,
    elapsedMs,
    startRecording,
    stopRecording,
    error: recordingError,
    recordedFile,
    clearRecordedFile,
  } = useVoiceRecorder();

  // Fetch available transcription models
  const { data: models } = useQuery(
    orpc.transcribe.models.queryOptions({ enabled: showControls })
  );

  // Auto-select first model when models are loaded and no model is selected
  useEffect(() => {
    if (models && models.length > 0 && !model) {
      onModelChange?.(models[0].id);
    }
  }, [models, model, onModelChange]);

  // Transcription mutation
  const transcribeMutation = useMutation(
    orpc.transcribe.transcribe.mutationOptions({
      onSuccess: (transcribedText) => {
        onTranscribed(transcribedText);
        clearRecordedFile();
        setIsTranscribing(false);
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : 'خطا در تبدیل صدا به متن';
        onError?.(errorMessage);
        setIsTranscribing(false);
      },
    })
  );

  // Handle transcription when recordedFile becomes available
  useEffect(() => {
    if (recordedFile) {
      setIsTranscribing(true);
      transcribeMutation.mutate({
        file: recordedFile,
        language,
        model,
      });
    }
  }, [recordedFile, transcribeMutation, language, model]);

  // Map recording errors to user-friendly messages
  const mapRecordingError = useCallback((error: RecordingError): string => {
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
        return fa.transcribe.errors.processFailed;
    }
  }, []);

  // Handle recording error
  useEffect(() => {
    if (recordingError) {
      const errorMessage = mapRecordingError(recordingError);
      onError?.(errorMessage);
    }
  }, [recordingError, onError, mapRecordingError]);

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const getButtonText = () => {
    if (isRecording) {
      return `${fa.chat.micStop} • ${formatElapsed(elapsedMs)}`;
    }
    if (isTranscribing) {
      return fa.chat.transcribingVoice;
    }
    return fa.chat.micStart;
  };

  const isButtonDisabled = disabled || isTranscribing;

  if (showControls) {
    return (
      <div className="flex items-center gap-2">
        {/* Language Toggle - only show if onLanguageChange is provided */}
        {onLanguageChange && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {language === 'fa' ? fa.languages.persian : fa.languages.english}
            </span>
            <Switch
              aria-label="toggle input audio language"
              checked={language === 'fa'}
              onCheckedChange={(checked) =>
                onLanguageChange?.(checked ? 'fa' : 'en')
              }
            />
          </div>
        )}

        {/* Model Select */}
        <Select onValueChange={(value) => onModelChange?.(value)} value={model}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(models || availableModels).map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Transcribe Button */}
        <Button
          className={`${className} ${isRecording ? 'animate-pulse' : ''}`}
          disabled={isButtonDisabled}
          onClick={handleClick}
          size={size}
          title={getButtonText()}
          variant={isRecording ? 'destructive' : variant}
        >
          {isRecording ? (
            <Square className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
          {isRecording && size !== 'icon' && (
            <span className="mr-2 text-xs rtl:mr-0 rtl:ml-2">
              {formatElapsed(elapsedMs)}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      className={`${className} ${isRecording ? 'animate-pulse' : ''}`}
      disabled={isButtonDisabled}
      onClick={handleClick}
      size={size}
      title={getButtonText()}
      variant={isRecording ? 'destructive' : variant}
    >
      {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
      {isRecording && size !== 'icon' && (
        <span className="mr-2 text-xs rtl:mr-0 rtl:ml-2">
          {formatElapsed(elapsedMs)}
        </span>
      )}
    </Button>
  );
}

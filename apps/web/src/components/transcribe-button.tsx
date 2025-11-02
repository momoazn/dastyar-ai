import { useQuery } from "@tanstack/react-query";
import { Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/components/ui";
import { useTranscription } from "@/hooks/use-transcription";
import {
  formatElapsed,
  type RecordingError,
  useVoiceRecorder,
} from "@/hooks/use-voice-recorder";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export function mapRecordingError(error: RecordingError): string {
  switch (error) {
    case "micAccessDenied":
      return fa.transcribe.errors.micAccess;
    case "noAudioCaptured":
      return fa.transcribe.errors.noAudio;
    case "fileTooLarge":
      return "فایل ضبط شده خیلی بزرگ است. حداکثر سایز مجاز 50MB می‌باشد.";
    case "initFailed":
    case "processingFailed":
      return fa.transcribe.errors.processFailed;
    default:
      return fa.transcribe.errors.processFailed;
  }
}

type TranscribeButtonProps = {
  onTranscribed: (text: string) => void;
  onError?: (error: string) => void;
  language?: "fa" | "en";
  model?: string;
  engine?: "whisperx" | "whisper";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  showControls?: boolean;
  onLanguageChange?: (language: "fa" | "en") => void;
  onModelChange?: (model: string) => void;
  onEngineChange?: (engine: "whisperx" | "whisper") => void;
  availableModels?: Array<{ id: string; name: string }>;
};

export function getTranscribeButtonText(
  isRecording: boolean,
  isPending: boolean,
  elapsedMs: number
): string {
  if (isRecording) {
    return `${fa.chat.micStop} • ${formatElapsed(elapsedMs)}`;
  }
  if (isPending) {
    return fa.chat.transcribingVoice;
  }
  return fa.chat.micStart;
}

export function TranscribeButton({
  onTranscribed,
  onError,
  language = "fa",
  model = "",
  engine = "whisperx",
  variant = "outline",
  size = "default",
  className,
  disabled = false,
  showControls = false,
  onLanguageChange,
  onModelChange,
  onEngineChange,
  availableModels = [],
}: TranscribeButtonProps) {
  // Use mutation pending state instead of separate local state for transcribing

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
    orpc.transcribe.models.queryOptions({
      input: { engine },
      enabled: showControls,
    })
  );

  // Auto-select first model when models are loaded and no model is selected
  useEffect(() => {
    if (models && models.length > 0 && !model) {
      onModelChange?.(models[0].id);
    }
  }, [models, model, onModelChange]);

  // Track if we've already processed the current recorded file
  const processedFileRef = useRef<File | null>(null);

  // Unified transcription logic
  const { transcribe, isPending } = useTranscription({
    onSuccess: (text) => {
      onTranscribed(text);
      clearRecordedFile();
      processedFileRef.current = null;
    },
    onError: (message) => {
      onError?.(message);
      // Keep processedFileRef pointing to the same file to prevent auto-retry loops
    },
  });

  // Handle transcription when recordedFile becomes available
  useEffect(() => {
    if (recordedFile && recordedFile !== processedFileRef.current) {
      processedFileRef.current = recordedFile;
      transcribe({
        file: recordedFile,
        language,
        model: model || undefined,
        engine,
      });
    }
  }, [recordedFile, language, model, engine, transcribe]);

  // Map recording errors to user-friendly messages
  const mapRecordingErrorCb = useCallback(mapRecordingError, []);

  // Handle recording error
  useEffect(() => {
    if (recordingError) {
      const errorMessage = mapRecordingErrorCb(recordingError);
      onError?.(errorMessage);
    }
  }, [recordingError, onError, mapRecordingErrorCb]);

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const getButtonText = () =>
    getTranscribeButtonText(isRecording, isPending, elapsedMs);

  const isButtonDisabled = disabled || isPending;

  if (showControls) {
    return (
      <div className="flex items-center gap-2">
        {/* Language Toggle - only show if onLanguageChange is provided */}
        {onLanguageChange && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {language === "fa" ? fa.languages.persian : fa.languages.english}
            </span>
            <Switch
              aria-label="toggle input audio language"
              checked={language === "fa"}
              onCheckedChange={(checked) =>
                onLanguageChange?.(checked ? "fa" : "en")
              }
            />
          </div>
        )}

        {/* Engine Select - only show if onEngineChange is provided */}
        {onEngineChange && (
          <Select
            onValueChange={(value) =>
              onEngineChange?.(value as "whisperx" | "whisper")
            }
            value={engine}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whisperx">WhisperX</SelectItem>
              <SelectItem value="whisper">Whisper</SelectItem>
            </SelectContent>
          </Select>
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
          aria-label={
            isRecording ? fa.transcribe.recordStop : fa.transcribe.recordStart
          }
          className={`${className} ${isRecording ? "animate-pulse" : ""}`}
          disabled={isButtonDisabled}
          onClick={handleClick}
          size={size}
          title={getButtonText()}
          type="button"
          variant={isRecording ? "destructive" : variant}
        >
          {(() => {
            const Icon = isRecording ? Square : Mic;
            return <Icon className="size-4" />;
          })()}
          {isRecording && size !== "icon" && (
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
      aria-label={
        isRecording ? fa.transcribe.recordStop : fa.transcribe.recordStart
      }
      className={`${className} ${isRecording ? "animate-pulse" : ""}`}
      disabled={isButtonDisabled}
      onClick={handleClick}
      size={size}
      title={getButtonText()}
      type="button"
      variant={isRecording ? "destructive" : variant}
    >
      {(() => {
        const Icon = isRecording ? Square : Mic;
        return <Icon className="size-4" />;
      })()}
      {isRecording && size !== "icon" && (
        <span className="mr-2 text-xs rtl:mr-0 rtl:ml-2">
          {formatElapsed(elapsedMs)}
        </span>
      )}
    </Button>
  );
}

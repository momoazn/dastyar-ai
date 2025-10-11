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

type TranscribeButtonProps = {
  onTranscribed: (text: string) => void;
  onError?: (error: string) => void;
  language?: "fa" | "en";
  model?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  showControls?: boolean;
  onLanguageChange?: (language: "fa" | "en") => void;
  onModelChange?: (model: string) => void;
  availableModels?: Array<{ id: string; name: string }>;
};

export function TranscribeButton({
  onTranscribed,
  onError,
  language = "fa",
  model = "",
  variant = "outline",
  size = "default",
  className,
  disabled = false,
  showControls = false,
  onLanguageChange,
  onModelChange,
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
    orpc.transcribe.models.queryOptions({ enabled: showControls })
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
      (async () => {
        try {
          await transcribe({
            file: recordedFile,
            language,
            model: model || undefined,
          });
        } catch {
          // Prevent auto-retry loop by keeping reference to the same file
          processedFileRef.current = recordedFile;
          onError?.("خطا در پردازش فایل صوتی. لطفاً دوباره تلاش کنید.");
        }
      })();
    }
  }, [recordedFile, language, model, onError, transcribe]);

  // Map recording errors to user-friendly messages
  const mapRecordingError = useCallback((error: RecordingError): string => {
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
    if (isPending) {
      return fa.chat.transcribingVoice;
    }
    return fa.chat.micStart;
  };

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
          className={`${className} ${isRecording ? "animate-pulse" : ""}`}
          disabled={isButtonDisabled}
          onClick={handleClick}
          size={size}
          title={getButtonText()}
          variant={isRecording ? "destructive" : variant}
        >
          {isRecording ? (
            <Square className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
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
      className={`${className} ${isRecording ? "animate-pulse" : ""}`}
      disabled={isButtonDisabled}
      onClick={handleClick}
      size={size}
      title={getButtonText()}
      variant={isRecording ? "destructive" : variant}
    >
      {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
      {isRecording && size !== "icon" && (
        <span className="mr-2 text-xs rtl:mr-0 rtl:ml-2">
          {formatElapsed(elapsedMs)}
        </span>
      )}
    </Button>
  );
}

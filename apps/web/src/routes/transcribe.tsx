import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CopyIcon, Mic, RefreshCcw, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranscription } from "@/hooks/use-transcription";
import {
  formatElapsed,
  type RecordingError,
  useVoiceRecorder,
} from "@/hooks/use-voice-recorder";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

const MAX_DURATION_MS = 60_000; // 60s visual progress

const getBadgeVariant = (
  isRecording: boolean,
  isTranscribing: boolean
): "default" | "secondary" | "destructive" | "outline" => {
  if (isRecording) {
    return "destructive";
  }
  if (isTranscribing) {
    return "secondary";
  }
  return "outline";
};

const getStatusText = (
  isRecording: boolean,
  isTranscribing: boolean,
  elapsedMs: number
): string => {
  if (isRecording) {
    return `${fa.transcribe.recordingPrefix} • ${formatElapsed(elapsedMs)}`;
  }
  if (isTranscribing) {
    return fa.transcribe.transcribing;
  }
  return fa.transcribe.idle;
};

export const Route = createFileRoute("/transcribe")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState<"fa" | "en">("fa");
  const [model, setModel] = useState<string>("Xenova/whisper-tiny");

  const {
    isRecording,
    elapsedMs,
    startRecording,
    stopRecording,
    error: recordingError,
    recordedFile,
    clearRecordedFile,
  } = useVoiceRecorder();

  const { data: models } = useQuery(orpc.transcribe.models.queryOptions());

  const { transcribe, isPending: isTranscribing } = useTranscription({
    onSuccess: (data) => {
      setResult(data);
      clearRecordedFile();
    },
    onError: (message) => {
      setTranscribeError(message || fa.transcribe.errors.transcribeFailed);
    },
  });

  // Prevent duplicate transcriptions per recorded file (e.g., Strict Mode double-effects)
  const processedFileRef = useRef<File | null>(null);

  // Map recording errors to localized messages
  const mapRecordingError = (error: RecordingError): string => {
    switch (error) {
      case "micAccessDenied":
        return fa.transcribe.errors.micAccess;
      case "noAudioCaptured":
        return fa.transcribe.errors.noAudio;
      case "fileTooLarge":
        return fa.transcribe.errors.fileTooLarge;
      default:
        return fa.transcribe.errors.processFailed;
    }
  };

  // Effect to transcribe when recordedFile becomes available
  useEffect(() => {
    if (recordedFile && recordedFile !== processedFileRef.current) {
      processedFileRef.current = recordedFile;
      setTranscribeError(null);
      setResult("");
      transcribe({ file: recordedFile, language, model }).catch(() => {
        // Keep processed ref pointing to the same file to avoid auto-retry loops
        processedFileRef.current = recordedFile;
        setTranscribeError(fa.transcribe.errors.processFailed);
      });
    }
  }, [recordedFile, transcribe, language, model]);

  const handleStartRecording = async () => {
    setTranscribeError(null);
    setResult("");
    await startRecording();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      // ignore copy failures
    }
  };

  const handleClear = () => {
    setResult("");
    setTranscribeError(null);
  };

  // File upload removed; only voice recording is supported

  // Get the first available error to display
  const displayError = recordingError
    ? mapRecordingError(recordingError)
    : transcribeError;

  const statusText = getStatusText(isRecording, isTranscribing, elapsedMs);
  const progressValue = Math.min(100, (elapsedMs / MAX_DURATION_MS) * 100);
  const badgeVariant = getBadgeVariant(isRecording, isTranscribing);

  return (
    <ToolScaffold
      alerts={
        displayError ? (
          <Alert variant="destructive">
            <AlertTitle>{fa.general.error}</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : null
      }
      content={
        <Card className="mx-auto w-10/12">
          <CardHeader className="gap-1">
            <div>
              <CardTitle>{fa.transcribe.title}</CardTitle>
              <CardDescription>{fa.transcribe.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  {isTranscribing ? (
                    <LoadingSpinner className="size-4" />
                  ) : (
                    <span
                      className={`inline-block size-2 rounded-full ${
                        isRecording ? "bg-red-500" : "bg-muted-foreground/40"
                      }`}
                    />
                  )}
                  <Badge variant={badgeVariant}>{statusText}</Badge>
                </div>
                <div className="flex items-center gap-3" />
              </div>
              <Progress value={isRecording ? progressValue : 0} />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Textarea
              aria-label={fa.transcribe.title}
              className={language === "fa" ? "rtl text-right" : "ltr text-left"}
              dir={language === "fa" ? "rtl" : "ltr"}
              placeholder={fa.transcribe.resultPlaceholder}
              readOnly
              rows={8}
              value={result}
            />
            <div className="flex w-full items-center justify-between gap-2">
              <div className="text-muted-foreground text-xs">
                {isRecording
                  ? `${fa.transcribe.elapsedLabel}: ${formatElapsed(elapsedMs)}`
                  : ""}
              </div>
              <div className="flex items-center gap-2">
                {recordedFile && !isTranscribing && (
                  <Button
                    className="gap-2"
                    onClick={async () => {
                      try {
                        await transcribe({
                          file: recordedFile,
                          language,
                          model,
                        });
                      } catch {
                        setTranscribeError(fa.transcribe.errors.processFailed);
                      }
                    }}
                    type="button"
                    variant="outline"
                  >
                    <RefreshCcw className="size-4" /> {fa.general.retry}
                  </Button>
                )}
                <Button
                  className="gap-2"
                  disabled={!result}
                  onClick={handleCopy}
                  type="button"
                  variant="default"
                >
                  <CopyIcon className="size-4" /> {fa.transcribe.copy}
                </Button>
                <Button
                  className="gap-2"
                  disabled={!result || isRecording || isTranscribing}
                  onClick={handleClear}
                  type="button"
                  variant="secondary"
                >
                  <Trash2 className="size-4" /> {fa.transcribe.clear}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      }
      toolbar={
        <>
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span>
                {language === "fa"
                  ? fa.languages.persian
                  : fa.languages.english}
              </span>
              <Switch
                aria-label="toggle input audio language"
                checked={language === "fa"}
                onCheckedChange={(checked) =>
                  setLanguage(checked ? "fa" : "en")
                }
              />
            </div>
            <Select onValueChange={setModel} value={model}>
              <SelectTrigger className="w-56" size="sm">
                <SelectValue placeholder={fa.modelSelection.model} />
              </SelectTrigger>
              <SelectContent>
                {models?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              aria-label={
                isRecording
                  ? fa.transcribe.recordStop
                  : fa.transcribe.recordStart
              }
              aria-pressed={isRecording}
              className="min-w-[140px] gap-2"
              disabled={isTranscribing}
              onClick={isRecording ? stopRecording : handleStartRecording}
              type="button"
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? (
                <>
                  <Square className="size-4" />
                  {fa.transcribe.recordStop}
                </>
              ) : (
                <>
                  <Mic className="size-4" />
                  {fa.transcribe.recordStart}
                </>
              )}
            </Button>
          </div>
        </>
      }
    />
  );
}

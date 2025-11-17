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
  Textarea,
} from "@/components/ui";
import { Label } from "@/components/ui/label";
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
  const [model, setModel] = useState<string>("ggml-base.bin");

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
      transcribe({ file: recordedFile, language, model });
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
        <Card className="mx-auto w-full max-w-6xl">
          <CardHeader>
            <CardTitle>{fa.transcribe.title}</CardTitle>
            <CardDescription>{fa.transcribe.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid items-end gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label
                      className="text-muted-foreground text-xs"
                      htmlFor="language-select"
                    >
                      {fa.translation.sourceLanguage}
                    </Label>
                    <Select
                      onValueChange={(v) => setLanguage(v as "fa" | "en")}
                      value={language}
                    >
                      <SelectTrigger
                        className="w-full"
                        id="language-select"
                        size="sm"
                      >
                        <SelectValue
                          placeholder={fa.translation.sourceLanguage}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">
                          {fa.languages.persian}
                        </SelectItem>
                        <SelectItem value="en">
                          {fa.languages.english}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label
                      className="text-muted-foreground text-xs"
                      htmlFor="model-select"
                    >
                      {fa.modelSelection.speechModel}
                    </Label>
                    <Select
                      disabled={!models?.length}
                      onValueChange={setModel}
                      value={model}
                    >
                      <SelectTrigger
                        className="w-full"
                        id="model-select"
                        size="sm"
                      >
                        <SelectValue
                          placeholder={fa.modelSelection.selectSpeechModel}
                        />
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
                </div>

                <div className="flex items-center justify-between">
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
                    <Badge aria-live="polite" variant={badgeVariant}>
                      {statusText}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {isRecording
                      ? `${fa.transcribe.elapsedLabel}: ${formatElapsed(elapsedMs)}`
                      : ""}
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-center">
                    <Button
                      aria-label={
                        isRecording
                          ? fa.transcribe.recordStop
                          : fa.transcribe.recordStart
                      }
                      aria-pressed={isRecording}
                      className={`gap-2 ${isRecording ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
                      disabled={isTranscribing}
                      onClick={
                        isRecording ? stopRecording : handleStartRecording
                      }
                      size="default"
                      type="button"
                      variant={isRecording ? "destructive" : "default"}
                    >
                      {isRecording ? (
                        <>
                          <Square className="size-5" />
                          {fa.transcribe.recordStop}
                        </>
                      ) : (
                        <>
                          <Mic className="size-5" />
                          {fa.transcribe.recordStart}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Progress value={isRecording ? progressValue : 0} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {fa.transcribe.title}
                  </div>
                  <div className="flex items-center gap-2">
                    {recordedFile && !isTranscribing && (
                      <Button
                        className="gap-2"
                        onClick={() => {
                          transcribe({
                            file: recordedFile,
                            language,
                            model,
                          });
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
                <Textarea
                  aria-label={fa.transcribe.title}
                  className={
                    language === "fa" ? "rtl text-right" : "ltr text-left"
                  }
                  dir={language === "fa" ? "rtl" : "ltr"}
                  placeholder={fa.transcribe.resultPlaceholder}
                  readOnly
                  rows={14}
                  value={result}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter />
        </Card>
      }
    />
  );
}

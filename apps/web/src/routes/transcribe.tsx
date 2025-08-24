import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CopyIcon, Mic, RefreshCcw, Square, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
} from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  formatElapsed,
  type RecordingError,
  useVoiceRecorder,
} from '@/hooks/use-voice-recorder';
import { fa } from '@/lib/persian-texts';
import { fileToWav16kMono } from '@/utils/audio';
import { orpc } from '@/utils/orpc';

const MAX_DURATION_MS = 60_000; // 60s visual progress

const getBadgeVariant = (
  isRecording: boolean,
  isTranscribing: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (isRecording) {
    return 'destructive';
  }
  if (isTranscribing) {
    return 'secondary';
  }
  return 'outline';
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

export const Route = createFileRoute('/transcribe')({
  component: RouteComponent,
});

function RouteComponent() {
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');
  const [model, setModel] = useState<string>('Xenova/whisper-tiny');

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

  const { mutate: transcribe, isPending: isTranscribing } = useMutation(
    orpc.transcribe.transcribe.mutationOptions({
      onSuccess: (data) => {
        setResult(data);
        // Only clear recorded file after successful transcription
        clearRecordedFile();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : fa.transcribe.errors.transcribeFailed;
        setTranscribeError(errorMessage);
        // Don't clear recorded file on error, allow retry
      },
    })
  );

  // Map recording errors to localized messages
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
        return fa.transcribe.errors.processFailed;
    }
  };

  // Effect to transcribe when recordedFile becomes available
  useEffect(() => {
    if (recordedFile) {
      setTranscribeError(null);
      setResult('');
      // Convert to WAV 16k mono for server compatibility
      fileToWav16kMono(recordedFile)
        .then((wav) =>
          transcribe({
            file: wav,
            language,
            model,
          })
        )
        .catch(() => {
          setTranscribeError(fa.transcribe.errors.processFailed);
        });
    }
  }, [recordedFile, transcribe, language, model]);

  const handleStartRecording = async () => {
    setTranscribeError(null);
    setResult('');
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
    setResult('');
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
    <section className="w-full" dir="rtl" lang="fa">
      <Card className="mx-auto mt-4 w-10/12">
        <CardHeader className="gap-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{fa.transcribe.title}</CardTitle>
              <CardDescription>{fa.transcribe.description}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>
                  {language === 'fa'
                    ? fa.languages.persian
                    : fa.languages.english}
                </span>
                <Switch
                  aria-label="toggle input audio language"
                  checked={language === 'fa'}
                  onCheckedChange={(checked) =>
                    setLanguage(checked ? 'fa' : 'en')
                  }
                />
              </div>
              <Select onValueChange={setModel} value={model}>
                <SelectTrigger size="sm">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayError ? (
            <Alert variant="destructive">
              <AlertTitle>{fa.general.error}</AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                {isTranscribing ? (
                  <LoadingSpinner className="size-4" />
                ) : (
                  <span
                    className={`inline-block size-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-muted-foreground/40'}`}
                  />
                )}
                <Badge variant={badgeVariant}>{statusText}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  aria-label={
                    isRecording
                      ? fa.transcribe.recordStop
                      : fa.transcribe.recordStart
                  }
                  aria-pressed={isRecording}
                  className="h-12 min-w-48 gap-2 text-base"
                  disabled={isTranscribing}
                  onClick={isRecording ? stopRecording : handleStartRecording}
                  type="button"
                  variant={isRecording ? 'destructive' : 'default'}
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
            </div>
            <Progress value={isRecording ? progressValue : 0} />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Textarea
            aria-label={fa.transcribe.title}
            className={language === 'fa' ? 'rtl text-right' : 'ltr text-left'}
            dir={language === 'fa' ? 'rtl' : 'ltr'}
            placeholder={fa.transcribe.resultPlaceholder}
            readOnly
            rows={8}
            value={result}
          />
          <div className="flex w-full items-center justify-between gap-2">
            <div className="text-muted-foreground text-xs">
              {isRecording
                ? `${fa.transcribe.elapsedLabel}: ${formatElapsed(elapsedMs)}`
                : ''}
            </div>
            <div className="flex items-center gap-2">
              {recordedFile && !isTranscribing && (
                <Button
                  className="gap-2"
                  onClick={async () => {
                    try {
                      const wav = await fileToWav16kMono(recordedFile);
                      transcribe({ file: wav, language, model });
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
    </section>
  );
}

import { useMutation } from '@tanstack/react-query';
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
  Input,
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
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

const MAX_DURATION_MS = 60_000; // 60s visual progress
const MODELS = [
  { id: 'tiny', name: 'Tiny' },
  { id: 'base', name: 'Base' },
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'large-v2', name: 'Large v2' },
  { id: 'large-v3', name: 'Large v3' },
];

const serializeResult = (data: {
  text: string;
  language?: string;
  model_used?: string;
  processing_ms?: number;
  segments?: Array<{ start: number; end: number; text: string }>;
}): string => {
  // For the transcribe page, we might want to show more info
  if (data.segments && data.segments.length > 0) {
    // Show verbose output with timestamps if available
    const segmentsText = data.segments
      .map(
        (seg) =>
          `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s]: ${seg.text}`
      )
      .join('\n');
    return `${data.text}\n\n--- Segments ---\n${segmentsText}`;
  }

  // Just return the text for simple format
  return data.text;
};

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
  elapsedMs: number,
  t: typeof PERSIAN_TEXTS.transcribe
): string => {
  if (isRecording) {
    return `${t.recordingPrefix} • ${formatElapsed(elapsedMs)}`;
  }
  if (isTranscribing) {
    return t.transcribing;
  }
  return t.idle;
};

export const Route = createFileRoute('/transcribe')({
  component: RouteComponent,
});

function RouteComponent() {
  const t = PERSIAN_TEXTS.transcribe;
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');
  const [model, setModel] = useState<string>('tiny');

  const {
    isRecording,
    elapsedMs,
    startRecording,
    stopRecording,
    error: recordingError,
    recordedFile,
    clearRecordedFile,
  } = useVoiceRecorder();

  const { mutate: transcribe, isPending: isTranscribing } = useMutation(
    orpc.transcribe.transcribe.mutationOptions({
      onSuccess: (data) => {
        setResult(serializeResult(data));
        // Only clear recorded file after successful transcription
        clearRecordedFile();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : t.errors.transcribeFailed;
        setTranscribeError(errorMessage);
        // Don't clear recorded file on error, allow retry
      },
    })
  );

  // Map recording errors to localized messages
  const mapRecordingError = (error: RecordingError): string => {
    switch (error) {
      case 'micAccessDenied':
        return t.errors.micAccess;
      case 'noAudioCaptured':
        return t.errors.noAudio;
      case 'fileTooLarge':
        return 'فایل ضبط شده خیلی بزرگ است. حداکثر سایز مجاز 50MB می‌باشد.';
      case 'initFailed':
      case 'processingFailed':
        return t.errors.processFailed;
      default:
        return t.errors.processFailed;
    }
  };

  // Effect to transcribe when recordedFile becomes available
  useEffect(() => {
    if (recordedFile) {
      setTranscribeError(null);
      setResult('');
      transcribe({
        file: recordedFile,
        language,
        model,
        responseFormat: 'verbose',
        includeTimestamps: true,
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

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      return;
    }

    // Validate file size (50MB limit)
    const maxFileSize = 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setTranscribeError(
        `فایل خیلی بزرگ است. حداکثر سایز ${maxFileSize / (1024 * 1024)}MB می‌باشد.`
      );
      return;
    }

    // Validate file type
    const supportedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/mp4',
      'audio/flac',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
      'video/webm',
    ];
    if (!supportedTypes.includes(file.type)) {
      setTranscribeError(`فرمت فایل پشتیبانی نمی‌شود: ${file.type}`);
      return;
    }

    setTranscribeError(null);
    setResult('');
    transcribe({
      file,
      language,
      model,
      responseFormat: 'verbose',
      includeTimestamps: true,
    });
  };

  // Get the first available error to display
  const displayError = recordingError
    ? mapRecordingError(recordingError)
    : transcribeError;

  const statusText = getStatusText(isRecording, isTranscribing, elapsedMs, t);
  const progressValue = Math.min(100, (elapsedMs / MAX_DURATION_MS) * 100);
  const badgeVariant = getBadgeVariant(isRecording, isTranscribing);

  return (
    <section className="w-full" dir="rtl" lang="fa">
      <Card className="mx-auto mt-4 w-10/12">
        <CardHeader className="gap-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>{language === 'fa' ? 'فارسی' : 'English'}</span>
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
                  <SelectValue placeholder="مدل" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
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
              <AlertTitle>{PERSIAN_TEXTS.general.error}</AlertTitle>
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
                <Input
                  accept="audio/*,video/mp4,video/webm"
                  aria-label="upload audio"
                  className="w-56"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] ?? null;
                    handleFileUpload(file);
                    // Reset input value to allow re-selecting same file
                    e.currentTarget.value = '';
                  }}
                  type="file"
                />
                <Button
                  aria-label={isRecording ? t.recordStop : t.recordStart}
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
                      {t.recordStop}
                    </>
                  ) : (
                    <>
                      <Mic className="size-4" />
                      {t.recordStart}
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
            aria-label={t.title}
            className={language === 'fa' ? 'rtl text-right' : 'ltr text-left'}
            dir={language === 'fa' ? 'rtl' : 'ltr'}
            placeholder={t.resultPlaceholder}
            readOnly
            rows={8}
            value={result}
          />
          <div className="flex w-full items-center justify-between gap-2">
            <div className="text-muted-foreground text-xs">
              {isRecording
                ? `${t.elapsedLabel}: ${formatElapsed(elapsedMs)}`
                : ''}
            </div>
            <div className="flex items-center gap-2">
              {recordedFile && !isTranscribing && (
                <Button
                  className="gap-2"
                  onClick={() =>
                    transcribe({
                      file: recordedFile,
                      language,
                      model,
                      responseFormat: 'verbose',
                      includeTimestamps: true,
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw className="size-4" /> تلاش مجدد
                </Button>
              )}
              <Button
                className="gap-2"
                disabled={!result}
                onClick={handleCopy}
                type="button"
                variant="default"
              >
                <CopyIcon className="size-4" /> {t.copy}
              </Button>
              <Button
                className="gap-2"
                disabled={!result || isRecording || isTranscribing}
                onClick={handleClear}
                type="button"
                variant="secondary"
              >
                <Trash2 className="size-4" /> {t.clear}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}

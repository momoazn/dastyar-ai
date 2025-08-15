import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CopyIcon, Mic, Square, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

const MAX_DURATION_MS = 60_000; // 60s visual progress
const MODELS = [
  { id: 'tiny.en', name: 'Tiny English' },
  { id: 'tiny', name: 'Tiny' },
  { id: 'base.en', name: 'Base English' },
  { id: 'base', name: 'Base' },
  { id: 'small.en', name: 'Small English' },
];

const serializeResult = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

const getPreferredMimeType = (): string | null => {
  if (
    typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ) {
    return 'audio/webm;codecs=opus';
  }
  return null;
};

const buildFileFromChunks = (
  recorder: MediaRecorder,
  chunks: BlobPart[]
): File => {
  const mimeType = recorder.mimeType || 'audio/webm';
  const audioBlob = new Blob(chunks, { type: mimeType });
  const fileExtension = mimeType.includes('webm') ? 'webm' : 'mp4';
  return new File([audioBlob], `recording-${Date.now()}.${fileExtension}`, {
    type: mimeType,
  });
};

const releaseTracks = (recorder: MediaRecorder) => {
  try {
    for (const track of recorder.stream.getTracks()) {
      track.stop();
    }
  } catch {
    // ignore
  }
};

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');
  const [modelId, setModelId] = useState<string>('tiny.en');
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const { mutateAsync: transcribe, isPending: isTranscribing } = useMutation(
    orpc.transcribe.transcribe.mutationOptions({
      onSuccess: (data) => {
        setResult(serializeResult(data));
      },
      onError: () => {
        setError(t.errors.transcribeFailed);
      },
    })
  );

  const attachRecorderHandlers = (recorder: MediaRecorder) => {
    chunksRef.current = [];

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => handleRecorderStop(recorder);
  };

  const handleRecorderStop = async (recorder: MediaRecorder) => {
    try {
      if (chunksRef.current.length === 0) {
        setError(t.errors.noAudio);
        return;
      }
      const file = buildFileFromChunks(recorder, chunksRef.current);
      await transcribe({ file, language, modelId });
    } catch {
      setError(t.errors.processFailed);
    } finally {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      releaseTracks(recorder);
      chunksRef.current = [];
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    setResult('');
    setElapsedMs(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = getPreferredMimeType();
      const recorder = preferred
        ? new MediaRecorder(stream, { mimeType: preferred })
        : new MediaRecorder(stream);
      attachRecorderHandlers(recorder);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedMs((ms) => ms + 250);
      }, 250);
    } catch {
      setError(t.errors.micAccess);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
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
    setError(null);
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    setError(null);
    setResult('');
    try {
      await transcribe({ file, language, modelId });
    } catch {
      // handled by onError
    }
  };

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
              <Select onValueChange={setModelId} value={modelId}>
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
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>{PERSIAN_TEXTS.general.error}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
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
                  accept="audio/*"
                  aria-label="upload audio"
                  className="w-56"
                  onChange={(e) =>
                    handleFileUpload(e.currentTarget.files?.[0] ?? null)
                  }
                  type="file"
                />
                <Button
                  aria-label={isRecording ? t.recordStop : t.recordStart}
                  aria-pressed={isRecording}
                  className="h-12 min-w-48 gap-2 text-base"
                  onClick={
                    isRecording ? handleStopRecording : handleStartRecording
                  }
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

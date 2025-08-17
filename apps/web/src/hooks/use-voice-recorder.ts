import { useCallback, useEffect, useRef, useState } from 'react';

export type RecordingError =
  | 'micAccessDenied'
  | 'noAudioCaptured'
  | 'initFailed'
  | 'processingFailed';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  elapsedMs: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: RecordingError | null;
  recordedFile: File | null;
}

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

export const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<RecordingError | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      releaseTracks(mediaRecorderRef.current);
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
  }, []);

  const attachRecorderHandlers = useCallback(
    (recorder: MediaRecorder) => {
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        try {
          if (chunksRef.current.length === 0) {
            setError('noAudioCaptured');
            setRecordedFile(null);
            return;
          }
          const file = buildFileFromChunks(recorder, chunksRef.current);
          setRecordedFile(file);
          setError(null);
        } catch {
          setError('processingFailed');
          setRecordedFile(null);
        } finally {
          cleanup();
        }
      };
    },
    [cleanup]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setElapsedMs(0);
    setRecordedFile(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let recorder: MediaRecorder;
      try {
        const preferred = getPreferredMimeType();
        recorder = preferred
          ? new MediaRecorder(stream, { mimeType: preferred })
          : new MediaRecorder(stream);
      } catch {
        setError('initFailed');
        // Release stream if recorder creation failed
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      attachRecorderHandlers(recorder);
      mediaRecorderRef.current = recorder;

      recorder.start();
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setElapsedMs((ms) => ms + 250);
      }, 250);
    } catch {
      setError('micAccessDenied');
    }
  }, [attachRecorderHandlers]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isRecording,
    elapsedMs,
    startRecording,
    stopRecording,
    error,
    recordedFile,
  };
};

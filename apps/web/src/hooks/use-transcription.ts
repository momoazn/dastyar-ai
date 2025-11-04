import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { orpc } from "@/utils/orpc";

export type TranscriptionArgs = {
  file: File;
  language?: "fa" | "en";
  model?: string;
};

export type UseTranscriptionHandlers = {
  onSuccess?: (text: string) => void;
  onError?: (message: string) => void;
};

export const useTranscription = (handlers?: UseTranscriptionHandlers) => {
  const handlersRef = useRef<UseTranscriptionHandlers | undefined>(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const { mutate, isPending } = useMutation(
    orpc.transcribe.transcribe.mutationOptions({
      onSuccess: (text) => {
        handlersRef.current?.onSuccess?.(text);
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "خطا در تبدیل صدا به متن";
        handlersRef.current?.onError?.(message);
      },
    })
  );

  const transcribe = useCallback(
    ({ file, language, model }: TranscriptionArgs) => {
      mutate({ file, language, model });
    },
    [mutate]
  );

  return { transcribe, isPending };
};

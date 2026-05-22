import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";
import {
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_SETTINGS,
} from "@/lib/image-generation-constants";
import {
  formatSizeValue,
  parseSearchParams,
  parseSizeValue,
} from "@/lib/image-generation-utils";
import { fa } from "@/lib/texts";
import type {
  GenerateInput,
  GenerationSettings,
} from "@/server/procedures/images";
import { type OrpcClient, orpc } from "@/utils/orpc";

export type GeneratedImage = Awaited<
  ReturnType<OrpcClient["images"]["listByThread"]>
>[number];

type UseImageGenerationProps = {
  threadId?: number;
  initialSettings?: Partial<GenerationSettings>;
  onSuccess?: (result: GeneratedImage) => void;
};

export function useImageGeneration({
  threadId,
  initialSettings,
  onSuccess,
}: UseImageGenerationProps = {}) {
  // Form state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [transcribeModel, setTranscribeModel] = useState("");

  // Settings state
  const [settings, setSettings] = useState<GenerationSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  // Query for service availability
  const { data: serviceStatus } = useQuery(
    orpc.images.checkService.queryOptions({
      meta: { suppressErrorToast: true },
    })
  );

  // Query for generated images list by thread

  const { data: images = [], refetch: refetchImages } = useQuery(
    orpc.images.listByThread.queryOptions({
      input: { threadId: threadId ?? 0 },
      enabled: !!threadId,
    })
  );

  // Query for available samplers
  const { data: samplersData } = useQuery(
    orpc.images.getSamplers.queryOptions({
      enabled: serviceStatus?.available === true,
      meta: { suppressErrorToast: true },
    })
  );

  // Mutation for generating images
  const generateMutation = useMutation(
    orpc.images.generate.mutationOptions({
      onSuccess: () => {
        toast.success(fa.imageGeneration.generationSuccess);
        refetchImages();
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          fa.imageGeneration.unknownError
        );
        toast.error(`${fa.imageGeneration.generationError}: ${errorMessage}`);
      },
    })
  );

  const generate = useCallback(
    async (input: GenerateInput): Promise<GeneratedImage | null> => {
      if (!input.prompt.trim()) {
        toast.error(fa.imageGeneration.promptRequired);
        return null;
      }
      if (!input.threadId) {
        toast.error(fa.imageGeneration.threadIdRequired);
        return null;
      }
      if (generateMutation.isPending) {
        toast.error(fa.imageGeneration.alreadyGenerating);
        return null;
      }
      if (!serviceStatus?.available) {
        toast.error(fa.imageGeneration.serviceUnavailable);
        return null;
      }

      try {
        const result = await generateMutation.mutateAsync(input);
        return result as GeneratedImage;
      } catch {
        // Error toast is handled in onError
        return null;
      }
    },
    [generateMutation, serviceStatus?.available]
  );

  const downloadImage = useCallback((image: { id: number; url: string }) => {
    try {
      const link = document.createElement("a");
      link.href = image.url;
      link.download = `generated_${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(fa.imageGeneration.downloadSuccess);
    } catch {
      toast.error(fa.imageGeneration.downloadError);
    }
  }, []);

  // Settings management
  const handleSizeChange = useCallback((value: string) => {
    const { width, height } = parseSizeValue(value);
    setSettings((prev) => ({ ...prev, width, height }));
  }, []);

  const getSizeValue = useCallback(
    () => formatSizeValue(settings.width, settings.height),
    [settings.width, settings.height]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const updateSettings = useCallback((updates: Partial<GenerationSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Keep settings.negativePrompt in sync with the dedicated state
  useEffect(() => {
    updateSettings({ negativePrompt });
  }, [negativePrompt, updateSettings]);

  // Form submission handler
  const handleSubmit = useCallback(
    async (promptText?: string, generationSettings?: GenerationSettings) => {
      const trimmed = (promptText || prompt).trim();
      if (!trimmed) {
        toast.error(fa.imageGeneration.promptRequired);
        return;
      }

      if (!serviceStatus?.available) {
        toast.error(fa.imageGeneration.serviceUnavailableError);
        return;
      }

      const settingsToUse = generationSettings || {
        ...settings,
        negativePrompt,
      };

      const result = await generate({
        ...settingsToUse,
        prompt: trimmed,
        threadId: threadId ?? 0,
      });

      if (result && onSuccess) {
        onSuccess(result);
        // Clear the prompt after successful generation
        setPrompt("");
      }

      return result;
    },
    [
      prompt,
      serviceStatus?.available,
      settings,
      negativePrompt,
      generate,
      threadId,
      onSuccess,
    ]
  );

  // Transcription handlers
  const handleTranscribeError = useCallback(() => {
    toast.error(fa.imageGeneration.voiceTranscriptionError);
  }, []);

  const handleTranscribed = useCallback((text: string) => {
    setPrompt((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const handleNegativePromptTranscribed = useCallback((text: string) => {
    setNegativePrompt(text);
  }, []);

  // NEW: Unified initialization method
  const initializeFromSearch = useCallback(
    (search: Record<string, string | number | boolean | null>) => {
      const { settings: parsedSettings, initialPrompt } =
        parseSearchParams(search);
      if (Object.keys(parsedSettings).length > 0) {
        updateSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
      if (initialPrompt) {
        setPrompt(initialPrompt);
      }
    },
    [updateSettings]
  );

  // NEW: Auto-submit handler
  const handleAutoSubmit = useCallback(
    async (
      targetThreadId: number,
      onRenameCallback?: (title: string) => Promise<void>
    ) => {
      if (!prompt.trim() || generateMutation.isPending) return null;

      const result = await generate({
        ...settings,
        prompt,
        threadId: targetThreadId,
      });

      if (result && onRenameCallback && images.length === 0) {
        await onRenameCallback(prompt.slice(0, 50));
      }

      setPrompt(""); // Clear after success
      return result;
    },
    [prompt, generateMutation.isPending, generate, settings, images.length]
  );

  // NEW: Bundle form props
  const formProps = useMemo(
    () => ({
      prompt,
      setPrompt,
      negativePrompt,
      setNegativePrompt,
      advancedSettingsOpen,
      setAdvancedSettingsOpen,
      transcribeModel,
      setTranscribeModel,
      settings,
      handleSizeChange,
      getSizeValue,
      handleTranscribeError,
      handleTranscribed,
      onSettingsChange: updateSettings,
      samplers: samplersData?.samplers || [],
    }),
    [
      prompt,
      negativePrompt,
      advancedSettingsOpen,
      transcribeModel,
      settings,
      handleSizeChange,
      getSizeValue,
      handleTranscribeError,
      handleTranscribed,
      updateSettings,
      samplersData?.samplers,
    ]
  );

  return {
    // API data
    images,
    samplers: samplersData?.samplers || [],
    isServiceAvailable: serviceStatus?.available,
    isGenerating: generateMutation.isPending,

    // Actions
    generate,
    downloadImage,
    refetchImages,
    updateSettings,
    resetSettings,

    // NEW: Bundled form props
    formProps,

    // NEW: Initialization & auto-submit
    initializeFromSearch,
    handleAutoSubmit,

    // Legacy handlers (for backward compatibility)
    handleSubmit,
    handleSizeChange,
    getSizeValue,
    handleTranscribeError,
    handleTranscribed,
    handleNegativePromptTranscribed,
  };
}

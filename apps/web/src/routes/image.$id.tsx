import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { Download, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { tokenAtom } from "@/atoms/auth";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message as AIMsg,
  MessageContent as AIMsgContent,
} from "@/components/ai-elements/message";
import { ImageBadges } from "@/components/image-generation/image-badges";
import { ImageGenerationInput } from "@/components/image-generation/image-generation-input";
import { ConversationScaffold } from "@/components/scaffold/conversation-scaffold";
import {
  Alert,
  AlertDescription,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useImageThreads } from "@/hooks/use-image-threads";
import ProtectedLayout from "@/layouts/protected";
import { DEFAULT_SETTINGS } from "@/lib/image-generation-constants";
import { buildSrc, getMergedSettings } from "@/lib/image-generation-utils";
import { fa } from "@/lib/persian-texts";
import type { GenerationSettings } from "@/server/procedures/images";

export const Route = createFileRoute("/image/$id")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const { id: threadId } = useParams({ from: "/image/$id" });
  const search = useSearch({ from: "/image/$id" }) as GenerationSettings & {
    initialPrompt?: string;
  };
  const numericThreadId = Number(threadId);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const token = useAtomValue(tokenAtom);

  const { rename } = useImageThreads();

  const {
    images = [],
    refetchImages,
    samplers,
    isServiceAvailable,
    generate,
    isGenerating,
    downloadImage,
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
    resetSettings,
    updateSettings,
    handleTranscribeError,
    handleTranscribed,
  } = useImageGeneration({
    threadId: numericThreadId,
    onSuccess: () => {
      refetchImages();
    },
  });

  const handleSubmitWithRename = useCallback(
    async (promptText: string, generationSettings: GenerationSettings) => {
      const trimmed = promptText.trim();
      if (!trimmed) {
        toast.error(fa.imageGeneration.promptRequired);
        return;
      }

      if (!isServiceAvailable) {
        toast.error(fa.imageGeneration.serviceUnavailableError);
        return;
      }

      setPendingPrompt(trimmed);

      const result = await generate({
        ...generationSettings,
        prompt: trimmed,
        threadId: numericThreadId,
      });

      if (result) {
        refetchImages();

        // Rename thread on first image generation
        if (images.length === 0) {
          const title = trimmed.slice(0, 50);
          await rename.mutateAsync({ id: numericThreadId, title });
        }

        // Clear the prompt after successful generation
        setPrompt("");
      }

      setPendingPrompt(null);
    },
    [
      generate,
      isServiceAvailable,
      numericThreadId,
      refetchImages,
      images.length,
      rename,
      setPrompt,
    ]
  );

  const orderedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      }),
    [images]
  );

  // Merge any settings provided via search once
  const hasMergedInitialSettingsRef = useRef(false);
  useEffect(() => {
    if (hasMergedInitialSettingsRef.current) {
      return;
    }
    const raw: Partial<GenerationSettings> = {
      width:
        typeof search.width === "string"
          ? Number(search.width)
          : (search.width as number | undefined),
      height:
        typeof search.height === "string"
          ? Number(search.height)
          : (search.height as number | undefined),
      steps:
        typeof search.steps === "string"
          ? Number(search.steps)
          : (search.steps as number | undefined),
      cfgScale:
        typeof search.cfgScale === "string"
          ? Number(search.cfgScale)
          : (search.cfgScale as number | undefined),
      sampler: search.sampler,
      negativePrompt: search.negativePrompt,
    };
    const merged = getMergedSettings(raw, DEFAULT_SETTINGS);
    if (
      raw.width ||
      raw.height ||
      raw.steps ||
      raw.cfgScale ||
      raw.sampler ||
      typeof raw.negativePrompt === "string"
    ) {
      updateSettings(merged);
    }
    hasMergedInitialSettingsRef.current = true;
  }, [search, updateSettings]);

  // Auto-submit once if an initial prompt is provided via navigation
  const hasSubmittedInitialRef = useRef(false);
  useEffect(() => {
    const p =
      typeof search?.initialPrompt === "string" ? search.initialPrompt : "";
    const raw: Partial<GenerationSettings> = {
      width:
        typeof search.width === "string"
          ? Number(search.width)
          : (search.width as number | undefined),
      height:
        typeof search.height === "string"
          ? Number(search.height)
          : (search.height as number | undefined),
      steps:
        typeof search.steps === "string"
          ? Number(search.steps)
          : (search.steps as number | undefined),
      cfgScale:
        typeof search.cfgScale === "string"
          ? Number(search.cfgScale)
          : (search.cfgScale as number | undefined),
      sampler: search.sampler,
      negativePrompt: search.negativePrompt,
    };
    const initial = getMergedSettings(raw, DEFAULT_SETTINGS);
    if (!hasSubmittedInitialRef.current && p.trim() && images.length === 0) {
      hasSubmittedInitialRef.current = true;
      handleSubmitWithRename(p, initial);
    }
  }, [search, images.length, handleSubmitWithRename]);

  if (Number.isNaN(numericThreadId) || numericThreadId <= 0) {
    return (
      <div className="flex h-full items-center justify-center" dir="rtl">
        <Alert>
          <AlertDescription>{fa.invalidThreadId}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ConversationScaffold
      banner={
        isServiceAvailable ? null : (
          <Alert>
            <AlertDescription>
              {fa.imageGeneration.serviceUnavailableAlert}
            </AlertDescription>
          </Alert>
        )
      }
      conversation={
        <Conversation className="h-full">
          <ConversationContent>
            {orderedImages.map((img) => {
              const raw = img.settings || {};
              const s = getMergedSettings(raw, settings);
              const src = buildSrc(img.url, token);
              const aspect = `${Math.max(1, s.width)} / ${Math.max(
                1,
                s.height
              )}`;
              return (
                <div className="space-y-1" key={img.id}>
                  <AIMsg from="user">
                    <AIMsgContent>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {img.prompt}
                      </div>
                      {img.negativePrompt ? (
                        <div className="text-[12px] text-muted-foreground">
                          {fa.imageGeneration.negativePrefix}{" "}
                          {img.negativePrompt}
                        </div>
                      ) : null}
                    </AIMsgContent>
                  </AIMsg>
                  <AIMsg from="assistant">
                    <AIMsgContent>
                      <div className="relative inline-block overflow-hidden rounded-md border">
                        <img
                          alt={img.prompt}
                          className="h-auto max-w-full bg-muted object-contain"
                          height={s.height}
                          src={src}
                          style={{ aspectRatio: aspect }}
                          width={s.width}
                        />
                        <ImageBadges settings={s} />
                        <div className="absolute top-2 left-2 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                aria-label={fa.imageGeneration.downloadImage}
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  downloadImage({ id: img.id, url: src });
                                }}
                                size="icon"
                                variant="secondary"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {fa.imageGeneration.downloadImage}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </AIMsgContent>
                  </AIMsg>
                </div>
              );
            })}
            {pendingPrompt ? (
              <>
                <AIMsg from="user">
                  <AIMsgContent>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {pendingPrompt}
                    </div>
                    {negativePrompt ? (
                      <div className="text-[12px] text-muted-foreground">
                        {fa.imageGeneration.negativePrefix} {negativePrompt}
                      </div>
                    ) : null}
                  </AIMsgContent>
                </AIMsg>
                <AIMsg from="assistant">
                  <AIMsgContent>
                    <Loader />
                  </AIMsgContent>
                </AIMsg>
              </>
            ) : null}
            {isGenerating && !pendingPrompt && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      }
      empty={
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <ImagePlus className="size-10" />
          <div className="space-y-1">
            <div className="font-medium">{fa.imageGeneration.newChatTitle}</div>
            <div className="text-xs">
              {fa.imageGeneration.newChatDescription}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="mx-auto max-w-4xl px-6 py-4">
          <ImageGenerationInput
            advancedSettingsOpen={advancedSettingsOpen}
            getSizeValue={getSizeValue}
            isGenerating={isGenerating}
            negativePrompt={negativePrompt}
            onAdvancedSettingsToggle={() => setAdvancedSettingsOpen((v) => !v)}
            onNegativePromptChange={setNegativePrompt}
            onPromptChange={setPrompt}
            onResetSettings={resetSettings}
            onSettingsChange={updateSettings}
            onSizeChange={handleSizeChange}
            onSubmit={() => {
              if (isGenerating || !prompt.trim() || !isServiceAvailable) {
                return;
              }
              handleSubmitWithRename(prompt, {
                steps: settings.steps,
                cfgScale: settings.cfgScale,
                negativePrompt,
                sampler: settings.sampler,
                width: settings.width,
                height: settings.height,
              });
            }}
            onTranscribed={handleTranscribed}
            onTranscribeError={handleTranscribeError}
            onTranscribeModelChange={setTranscribeModel}
            prompt={prompt}
            samplers={samplers}
            settings={settings}
            submitDisabled={
              isGenerating || !prompt.trim() || !isServiceAvailable
            }
            submitStatus={isGenerating ? "submitted" : undefined}
            submitVariant={isGenerating ? "destructive" : "default"}
            transcribeModel={transcribeModel}
          />
        </div>
      }
      isEmpty={orderedImages.length === 0 && !isGenerating && !pendingPrompt}
    />
  );
}

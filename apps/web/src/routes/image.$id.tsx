import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { Download, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

  const token = useAtomValue(tokenAtom);

  const { rename } = useImageThreads();

  const {
    formProps,
    images = [],
    refetchImages,
    isServiceAvailable,
    isGenerating,
    downloadImage,
    resetSettings,
    initializeFromSearch,
    handleAutoSubmit,
  } = useImageGeneration({
    threadId: numericThreadId,
    onSuccess: () => {
      refetchImages();
    },
  });

  // Simple submit handler
  const handleSubmit = useCallback(() => {
    const hasPrompt = formProps.prompt.trim();
    const canSubmit = hasPrompt && isServiceAvailable && !isGenerating;

    if (!canSubmit) return;

    const onRename =
      images.length === 0
        ? async (title: string) => {
            await rename.mutateAsync({ id: numericThreadId, title });
          }
        : undefined;

    handleAutoSubmit(numericThreadId, onRename);
  }, [
    formProps.prompt,
    isServiceAvailable,
    isGenerating,
    handleAutoSubmit,
    numericThreadId,
    images.length,
    rename,
  ]);

  const orderedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      }),
    [images]
  );

  // Initialize from search params
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    initializeFromSearch(search);
  }, [search, initializeFromSearch]);

  // Auto-submit if initialPrompt provided (separate effect to ensure prompt is set)
  const hasAutoSubmittedRef = useRef(false);
  useEffect(() => {
    if (
      hasAutoSubmittedRef.current ||
      !search.initialPrompt ||
      images.length > 0 ||
      !formProps.prompt.trim()
    ) {
      return;
    }

    hasAutoSubmittedRef.current = true;
    handleAutoSubmit(numericThreadId, async (title) => {
      await rename.mutateAsync({ id: numericThreadId, title });
    });
  }, [
    search.initialPrompt,
    images.length,
    formProps.prompt,
    numericThreadId,
    handleAutoSubmit,
    rename,
  ]);

  const hasPrompt = formProps.prompt.trim();
  const isServiceUnavailable = !isServiceAvailable;
  const isSubmitDisabled = !hasPrompt || isServiceUnavailable;

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
              const s = getMergedSettings(raw, formProps.settings);
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
            {isGenerating && formProps.prompt && (
              <>
                <AIMsg from="user">
                  <AIMsgContent>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {formProps.prompt}
                    </div>
                    {formProps.negativePrompt && (
                      <div className="text-[12px] text-muted-foreground">
                        {fa.imageGeneration.negativePrefix}{" "}
                        {formProps.negativePrompt}
                      </div>
                    )}
                  </AIMsgContent>
                </AIMsg>
                <AIMsg from="assistant">
                  <AIMsgContent>
                    <Loader />
                  </AIMsgContent>
                </AIMsg>
              </>
            )}
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
            formProps={formProps}
            isGenerating={isGenerating}
            onResetSettings={resetSettings}
            onSubmit={handleSubmit}
            submitDisabled={isSubmitDisabled}
            submitStatus={isGenerating ? "submitted" : undefined}
            submitVariant={isGenerating ? "destructive" : "default"}
          />
        </div>
      }
      isEmpty={orderedImages.length === 0 && !isGenerating}
    />
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ImagePlus } from "lucide-react";
import { useCallback, useState } from "react";
import { ImageGenerationInput } from "@/components/image-generation/image-generation-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useImageThreads } from "@/hooks/use-image-threads";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/image/")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { create } = useImageThreads();
  const [creating, setCreating] = useState(false);

  const { formProps, isServiceAvailable, resetSettings } = useImageGeneration();

  const handleCreateAndNavigate = useCallback(async () => {
    const trimmed = formProps.prompt.trim();
    if (!trimmed || creating || !isServiceAvailable) return;

    try {
      setCreating(true);
      const created = await create.mutateAsync({
        title: fa.imageChat.newChatDefaultTitle,
      });

      navigate({
        to: "/image/$id",
        params: { id: created.id.toString() },
        search: {
          initialPrompt: trimmed,
          ...formProps.settings,
          negativePrompt: formProps.negativePrompt,
        },
      });
    } finally {
      setCreating(false);
    }
  }, [formProps, creating, isServiceAvailable, create, navigate]);

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-6">
      <div className="mx-auto w-full max-w-3xl" dir="rtl">
        <div className="mb-6 text-center">
          <ImagePlus
            aria-hidden="true"
            className="mx-auto mb-2 size-12 text-muted-foreground"
          />
          <h1 className="font-semibold text-2xl">
            {fa.imageChat.newChatTitle}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {fa.imageChat.newChatDescription}
          </p>
        </div>
        {isServiceAvailable === false && (
          <Alert className="mb-4">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>{fa.imageGeneration.serviceUnavailable}</AlertTitle>
            <AlertDescription>
              {fa.imageGeneration.serviceUnavailableHelp}
            </AlertDescription>
          </Alert>
        )}
        <ImageGenerationInput
          disabled={isServiceAvailable === false}
          formProps={formProps}
          isGenerating={creating}
          onResetSettings={resetSettings}
          onSubmit={handleCreateAndNavigate}
          submitDisabled={
            creating || !formProps.prompt.trim() || isServiceAvailable === false
          }
        />
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus } from "lucide-react";
import { useCallback, useState } from "react";
import { ImageGenerationInput } from "@/components/image-generation/image-generation-input";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useImageThreads } from "@/hooks/use-image-threads";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";

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

  const {
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    advancedSettingsOpen,
    setAdvancedSettingsOpen,
    transcribeModel,
    setTranscribeModel,
    settings,
    samplers,
    isServiceAvailable,
    handleSizeChange,
    getSizeValue,
    resetSettings,
    updateSettings,
    handleTranscribeError,
    handleTranscribed,
  } = useImageGeneration();

  const handleCreateAndNavigate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || creating) {
      return;
    }
    if (!isServiceAvailable) {
      return;
    }
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
          width: settings.width,
          height: settings.height,
          steps: settings.steps,
          cfgScale: settings.cfgScale,
          sampler: settings.sampler,
          negativePrompt,
        },
      });
    } finally {
      setCreating(false);
    }
  }, [
    prompt,
    creating,
    isServiceAvailable,
    create,
    navigate,
    settings,
    negativePrompt,
  ]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="mx-auto w-full max-w-3xl" dir="rtl">
        <div className="mb-6 text-center">
          <ImagePlus className="mx-auto mb-2 size-12 text-muted-foreground" />
          <h1 className="font-semibold text-2xl">
            {fa.imageChat.newChatTitle}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {fa.imageChat.newChatDescription}
          </p>
        </div>
        <ImageGenerationInput
          advancedSettingsOpen={advancedSettingsOpen}
          getSizeValue={getSizeValue}
          isGenerating={creating}
          negativePrompt={negativePrompt}
          onAdvancedSettingsToggle={() => setAdvancedSettingsOpen((v) => !v)}
          onNegativePromptChange={setNegativePrompt}
          onPromptChange={setPrompt}
          onResetSettings={resetSettings}
          onSettingsChange={updateSettings}
          onSizeChange={handleSizeChange}
          onSubmit={handleCreateAndNavigate}
          onTranscribed={handleTranscribed}
          onTranscribeError={handleTranscribeError}
          onTranscribeModelChange={setTranscribeModel}
          prompt={prompt}
          samplers={samplers}
          settings={settings}
          submitDisabled={creating || !prompt.trim()}
          transcribeModel={transcribeModel}
        />
      </div>
    </div>
  );
}

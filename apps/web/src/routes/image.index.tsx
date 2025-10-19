import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui";
import { useImageThreads } from "@/hooks/use-image-threads";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

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

  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const textDirection = useMemo(
    () => (prompt ? detectTextDirection(prompt) : "rtl"),
    [prompt]
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || creating) {
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
        search: { initialPrompt: trimmed },
      });
    } catch {
      console.error("Failed to submit prompt");
    } finally {
      setCreating(false);
    }
  }, [prompt, creating, create, navigate]);

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
        <PromptInput
          onSubmit={(e) => {
            e.preventDefault();
            if (creating) return;
            handleSubmit();
          }}
        >
          <PromptInputTextarea
            dir={textDirection}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={fa.imageGeneration.promptPlaceholderAlt}
            value={prompt}
          />
          <PromptInputToolbar>
            <div className="flex items-center gap-2">
              <Button
                disabled={creating}
                onClick={() => {
                  if (!creating) handleSubmit();
                }}
                variant="outline"
              >
                {fa.navigation.newImageChat}
              </Button>
              <PromptInputSubmit disabled={creating || !prompt.trim()} />
            </div>
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}

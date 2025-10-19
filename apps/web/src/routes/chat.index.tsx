import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "@/components/chat";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { client, orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/chat/")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleSendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || creating) {
      return;
    }
    try {
      setCreating(true);
      const created = await client.threads.create({
        title: trimmed.slice(0, 10),
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });
      // Navigate and let /chat/$id send the initial prompt
      navigate({
        to: "/chat/$id",
        params: { id: created.id.toString() },
        search: { initialPrompt: trimmed },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to start new chat", error);
      toast.error(fa.chat.newChatError);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 text-center" dir="rtl">
          <h1 className="font-semibold text-xl">{fa.chat.newChatTitle}</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {fa.chat.newChatDescription}
          </p>
        </div>
        <ChatInput
          handleSendPrompt={handleSendPrompt}
          isGenerating={creating}
          // No thread yet; attachments hidden until redirected
        />
        <p className="mt-3 text-center text-muted-foreground text-xs" dir="rtl">
          {fa.chat.newChatHint}
        </p>
      </div>
    </div>
  );
}

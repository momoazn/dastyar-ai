import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { fa } from "@/lib/persian-texts";
import { client, orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatRouteComponent,
});

function ChatRouteComponent() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const created = await client.threads.create({
        title: fa.chat.newChatDefaultTitle,
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });
      navigate({ to: "/chat/$id", params: { id: created.id.toString() } });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create a new chat thread", error);
      toast.error(fa.chat.newChatError);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="space-y-4 text-center" dir="rtl">
        <h1 className="font-semibold text-xl">{fa.chat.newChatTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {fa.chat.newChatDescription}
        </p>
        <div>
          <Button disabled={isCreating} onClick={handleCreate}>
            {isCreating ? fa.general.loading : fa.navigation.newChat}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">{fa.chat.newChatHint}</p>
      </div>
    </div>
  );
}

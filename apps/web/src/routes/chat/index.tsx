import { createFileRoute } from "@tanstack/react-router";
import { ChatInput } from "@/components/chat";
import { useChatInput } from "@/hooks/use-chat-input";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/chat/")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const { handleSendPrompt, isGenerating } = useChatInput();

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
          isGenerating={isGenerating}
          // No thread yet; attachments hidden until redirected
        />
        <p className="mt-3 text-center text-muted-foreground text-xs" dir="rtl">
          {fa.chat.newChatHint}
        </p>
      </div>
    </div>
  );
}

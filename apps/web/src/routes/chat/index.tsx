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
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 py-6">
        <div className="space-y-2 px-4 text-center">
          <h1 className="text-balance font-bold text-2xl md:text-3xl">
            {fa.chat.newChatTitle}
          </h1>
          <p className="text-pretty text-muted-foreground text-sm leading-6">
            {fa.chat.newChatDescription}
          </p>
        </div>
        <ChatInput
          handleSendPrompt={handleSendPrompt}
          isGenerating={isGenerating}
        />
        <section aria-label={fa.chat.suggestionsLabel} className="px-4">
          <ul className="grid gap-2 sm:grid-cols-2">
            {fa.chat.suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  className="h-full w-full rounded-lg border bg-card px-4 py-3 text-start text-sm leading-6 transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  disabled={isGenerating}
                  onClick={() => handleSendPrompt(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

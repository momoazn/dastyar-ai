import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { ChatInput } from '@/components/chat-input';
import { NoMessages } from '@/components/no-messages';
import { client, orpc, queryClient } from '@/utils/orpc';
import { initialPromptAtom } from '../../atoms/initial-prompt';

export const Route = createFileRoute('/chat/')({
  component: ChatRouteComponent,
});

function ChatRouteComponent() {
  const navigate = useNavigate();
  const setInitialPrompt = useSetAtom(initialPromptAtom);

  const handleSendFirstMessage = async (prompt: string) => {
    const created = await client.threads.create({
      title: prompt.slice(0, 10),
    });
    await queryClient.invalidateQueries({
      queryKey: orpc.threads.list.queryKey(),
    });
    setInitialPrompt({ prompt, isUsed: false, threadId: created.id });
    navigate({
      to: '/chat/$id',
      params: { id: created.id },
    });
  };

  return (
    <div className="flex h-full flex-col">
      <NoMessages />
      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          handleSendPrompt={handleSendFirstMessage}
          isGenerating={false}
          stopGenerating={() => {
            /* noop */
          }}
        />
      </div>
    </div>
  );
}

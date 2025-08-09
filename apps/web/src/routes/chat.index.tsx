import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ChatInput } from '@/components/chat-input';
import { NoMessages } from '@/components/no-messages';
import { client, orpc, queryClient } from '@/utils/orpc';

export const Route = createFileRoute('/chat/')({
  component: ChatIndexComponent,
});

function ChatIndexComponent() {
  const navigate = useNavigate();
  const [chatModelId, setChatModelId] = useState('');
  const [prompt, setPrompt] = useState('');

  const { data: models } = useQuery(
    orpc.models.list.queryOptions({
      input: { isEnabled: true },
    })
  );

  // Default-select the first available model when none is chosen
  useEffect(() => {
    if (!chatModelId && models?.length) {
      setChatModelId(models[0].id);
    }
  }, [models, chatModelId]);

  const handleSendFirstMessage = async () => {
    const trimmed = prompt.trim();
    if (!(trimmed && chatModelId)) {
      return;
    }
    const created = await client.threads.create({
      title: trimmed.slice(0, 20),
    });
    await queryClient.invalidateQueries({
      queryKey: orpc.threads.list.queryKey({
        input: { includeArchived: false },
      }),
    });
    navigate({
      to: '/chat/$id',
      params: { id: created.id },
      state: { initialPrompt: trimmed, initialModel: chatModelId },
    });
    setPrompt('');
  };

  return (
    <div className="flex h-full flex-col">
      <NoMessages />
      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          chatModelId={chatModelId}
          handleSendPrompt={handleSendFirstMessage}
          isStreaming={false}
          models={models}
          prompt={prompt}
          setChatModelId={setChatModelId}
          setPrompt={setPrompt}
          stopStreaming={() => {
            // noop
          }}
        />
      </div>
    </div>
  );
}

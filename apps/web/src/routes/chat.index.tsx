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
  const [chatModel, setChatModel] = useState('');
  const [prompt, setPrompt] = useState('');

  const { data: models } = useQuery(
    orpc.models.list.queryOptions({
      input: { isEnabled: true },
    })
  );

  // Default-select the first available model when none is chosen
  useEffect(() => {
    if (!chatModel && models?.length) {
      setChatModel(models[0].id);
    }
  }, [models, chatModel]);

  const handleSendFirstMessage = async () => {
    const trimmed = prompt.trim();
    if (!(trimmed && chatModel)) {
      return;
    }
    const created = await client.threads.create({ title: undefined });
    await queryClient.invalidateQueries({
      queryKey: orpc.threads.list.queryKey(),
    });
    navigate({
      to: '/chat/$id',
      params: { id: created.id },
      state: { initialPrompt: trimmed, initialModel: chatModel },
    });
    setPrompt('');
  };

  return (
    <div className="flex h-full flex-col">
      <NoMessages />
      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          chatModel={chatModel}
          handleSendPrompt={handleSendFirstMessage}
          isStreaming={false}
          models={models}
          prompt={prompt}
          setChatModel={setChatModel}
          setPrompt={setPrompt}
          stopStreaming={() => {
            // noop
          }}
        />
      </div>
    </div>
  );
}

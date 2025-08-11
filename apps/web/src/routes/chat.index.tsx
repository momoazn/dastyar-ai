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

  // Load last selected model from localStorage when models are ready
  useEffect(() => {
    if (!models || models.length === 0) {
      return;
    }
    if (chatModelId) {
      return;
    }
    const KEY = 'ai:lastModelId';
    try {
      const saved =
        typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
      const exists = Boolean(
        saved && (models as Array<{ id: string }>).some((m) => m.id === saved)
      );
      if (exists && saved) {
        setChatModelId(saved);
        return;
      }
    } catch {
      // noop
    }
    setChatModelId((models as Array<{ id: string }>)[0].id);
  }, [models, chatModelId]);

  // Persist selected model to localStorage when valid
  useEffect(() => {
    if (!chatModelId) {
      return;
    }
    if (!models || models.length === 0) {
      return;
    }
    const exists = (models as Array<{ id: string }>).some(
      (m) => m.id === chatModelId
    );
    if (!exists) {
      return;
    }
    const KEY = 'ai:lastModelId';
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(KEY, chatModelId);
      }
    } catch {
      // noop
    }
  }, [chatModelId, models]);

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
          isGenerating={false}
          models={models}
          prompt={prompt}
          setChatModelId={setChatModelId}
          setPrompt={setPrompt}
          stopGenerating={() => {
            // noop
          }}
        />
      </div>
    </div>
  );
}

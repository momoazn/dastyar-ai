import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import { AiChat } from '@/components/chat';

export const Route = createFileRoute('/chat/$id')({
  component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
  const { id: threadId } = useParams({ from: '/chat/$id' });
  const search = useSearch({ from: '/chat/$id' }) as { prompt?: string };

  return <AiChat initialPrompt={search.prompt} threadId={threadId} />;
}

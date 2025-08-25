import { createFileRoute, useParams } from '@tanstack/react-router';
import { AiChat } from '@/components/chat';

export const Route = createFileRoute('/chat/$id')({
  component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
  const { id: threadId } = useParams({ from: '/chat/$id' });

  console.log('#### in chat.$id.tsx', threadId);

  return <AiChat threadId={threadId} />;
}

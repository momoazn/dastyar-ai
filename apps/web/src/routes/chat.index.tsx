import { createFileRoute } from '@tanstack/react-router';
import { AiChat } from '@/components/chat';

export const Route = createFileRoute('/chat/')({
  component: ChatRouteComponent,
});

function ChatRouteComponent() {
  console.log('#### in chat.index.tsx');

  return <AiChat />;
}

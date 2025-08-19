import { createFileRoute } from '@tanstack/react-router';
import { ImageSection } from '@/components/image-section';

export const Route = createFileRoute('/image')({
  component: ImageRouteComponent,
});

function ImageRouteComponent() {
  return (
    <main className="flex h-full flex-col">
      <ImageSection />
    </main>
  );
}

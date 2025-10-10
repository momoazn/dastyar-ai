import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ImagePlus } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui';
import { useImageThreads } from '@/hooks/use-image-threads';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/image')({
  component: () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { create } = useImageThreads();

    const handleCreate = useCallback(async () => {
      const created = await create.mutateAsync({
        title: fa.imageChat.newChatDefaultTitle,
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.imageThreads.list.queryKey(),
      });
      navigate({ to: '/image/$id', params: { id: created.id.toString() } });
    }, [create, navigate, queryClient]);

    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4"
        dir="rtl"
      >
        <ImagePlus className="size-16 text-muted-foreground" />
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-2xl">
            {fa.imageChat.newChatTitle}
          </h1>
          <p className="text-muted-foreground">
            {fa.imageChat.newChatDescription}
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          {fa.navigation.newImageChat}
        </Button>
      </div>
    );
  },
});

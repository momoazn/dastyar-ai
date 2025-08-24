import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { client, orpc } from '@/utils/orpc';

export function SummariesList() {
  const location = useLocation();
  const isSummarizePage = location.pathname.startsWith('/summarize');

  const listQuery = useQuery(
    orpc.summarize.list.queryOptions({ enabled: isSummarizePage })
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.summarize.delete({ id }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  if (!isSummarizePage) {
    return null;
  }

  return (
    <>
      {listQuery.data?.map((s) => (
        <Link
          className="relative flex h-12 items-center justify-between border-b p-4 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          key={s.id}
          search={{ id: s.id }}
          to="/summarize"
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              {isActive && (
                <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
              )}
              <span className="font-medium">
                {s.sourceText?.slice(0, 30) || fa.general.untitled}
              </span>
              <div className="flex items-center gap-0">
                <Button
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => handleDelete(s.id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              </div>
            </>
          )}
        </Link>
      ))}
    </>
  );
}

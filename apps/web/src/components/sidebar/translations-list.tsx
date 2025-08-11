import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { client, orpc } from '@/utils/orpc';

export function TranslationsList() {
  const location = useLocation();
  const isTranslationPage = location.pathname.startsWith('/translation');

  const listQuery = useQuery(
    orpc.translations.list.queryOptions({ enabled: isTranslationPage })
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => client.translations.delete({ id }),
    onSuccess: async () => {
      await listQuery.refetch();
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  if (!isTranslationPage) {
    return null;
  }

  return (
    <>
      {listQuery.data?.map((t) => (
        <Link
          className="relative flex h-12 items-center justify-between border-b p-4 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          key={t.id}
          search={{ id: t.id as string }}
          to="/translation"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
              )}
              <span className="font-medium">
                {t.sourceText?.slice(0, 30) || 'بدون عنوان'}
              </span>
              <div className="flex items-center gap-0">
                <Button
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => handleDelete(t.id)}
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

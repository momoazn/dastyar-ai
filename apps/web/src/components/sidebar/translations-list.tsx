import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { fa } from '@/lib/persian-texts';
import { client, orpc } from '@/utils/orpc';
import { TranslationEmptyState } from './empty-state';
import { StandardizedSidebarItem } from './standardized-sidebar-item';

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

  if (!listQuery.data?.length) {
    return <TranslationEmptyState />;
  }

  return (
    <>
      {listQuery.data?.map((t) => (
        <StandardizedSidebarItem
          key={t.id}
          onDelete={() => handleDelete(t.id)}
          search={{ id: t.id as string }}
          title={t.sourceText?.slice(0, 30) || fa.general.untitled}
          to="/translation"
        />
      ))}
    </>
  );
}

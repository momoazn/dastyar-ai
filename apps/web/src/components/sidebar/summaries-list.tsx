import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { fa } from '@/lib/persian-texts';
import { client, orpc } from '@/utils/orpc';
import { StandardizedSidebarItem } from './standardized-sidebar-item';
import { SummaryEmptyState } from './empty-state';

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

  if (!listQuery.data?.length) {
    return <SummaryEmptyState />;
  }

  return (
    <>
      {listQuery.data?.map((s) => (
        <StandardizedSidebarItem
          key={s.id}
          search={{ id: s.id }}
          title={s.sourceText?.slice(0, 30) || fa.general.untitled}
          to="/summarize"
          onDelete={() => handleDelete(s.id)}
        />
      ))}
    </>
  );
}

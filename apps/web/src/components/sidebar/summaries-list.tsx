import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';
import { SidebarItem, useSummaryMutations } from './base';
import { SummaryEmptyState } from './empty-state';

export function SummariesList() {
  const location = useLocation();
  const isSummarizePage = location.pathname.startsWith('/summarize');

  const mutations = useSummaryMutations();

  const listQuery = useQuery({
    ...orpc.summarize.list.queryOptions(),
    enabled: isSummarizePage,
  });

  const handleDelete = (id: number) => {
    mutations.delete.mutate(id);
  };

  if (!isSummarizePage) {
    return null;
  }

  if (!listQuery.data?.length) {
    return <SummaryEmptyState />;
  }

  return (
    <>
      {listQuery.data.map((summary) => (
        <SidebarItem
          actions={[
            {
              type: 'delete',
              onClick: () => handleDelete(summary.id),
              title: 'حذف',
            },
          ]}
          key={summary.id}
          search={{ id: summary.id.toString() }}
          title={summary.sourceText?.slice(0, 30) || fa.general.untitled}
          to="/summarize"
        />
      ))}
    </>
  );
}

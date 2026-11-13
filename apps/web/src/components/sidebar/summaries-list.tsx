import { useLocation } from "@tanstack/react-router";
import { fa } from "@/lib/texts";
import { makeTitle } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { SidebarItem, useSidebarList, useSummaryMutations } from "./base";
import { SummaryEmptyState } from "./empty-state";

export function SummariesList() {
  const location = useLocation();
  const isSummarizePage = location.pathname.startsWith("/summary");

  const mutations = useSummaryMutations();

  const listResult = useSidebarList({
    queryOptions: orpc.summarize.list.queryOptions(),
    enabled: isSummarizePage,
    emptyState: <SummaryEmptyState />,
  });

  const handleDelete = (id: number) => {
    mutations.delete.mutate(id);
  };

  if (!isSummarizePage) {
    return null;
  }

  if (listResult.isLoading && listResult.loadingComponent) {
    return listResult.loadingComponent;
  }

  if (listResult.isEmpty && listResult.emptyComponent) {
    return listResult.emptyComponent;
  }

  if (!listResult.data) {
    return null;
  }

  return (
    <>
      {listResult.data.map((summary) => (
        <SidebarItem
          actions={[
            {
              type: "delete",
              onClick: () => handleDelete(summary.id),
              title: fa.sidebar.actions.delete,
            },
          ]}
          key={summary.id}
          params={{ summaryId: String(summary.id) }}
          title={
            summary.sourceText
              ? makeTitle(summary.sourceText, 30)
              : fa.general.untitled
          }
          to="/summary/$summaryId"
        />
      ))}
    </>
  );
}

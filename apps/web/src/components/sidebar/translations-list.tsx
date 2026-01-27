import { useLocation } from "@tanstack/react-router";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import { SidebarItem, useSidebarList, useTranslationMutations } from "./base";
import { TranslationEmptyState } from "./empty-state";

export function TranslationsList() {
  const location = useLocation();
  const isTranslationPage = location.pathname.startsWith("/translation");

  const mutations = useTranslationMutations();

  const listResult = useSidebarList({
    queryOptions: orpc.translations.list.queryOptions(),
    enabled: isTranslationPage,
    emptyState: <TranslationEmptyState />,
  });

  const handleDelete = (id: number) => {
    mutations.delete.mutate(id);
  };

  if (!isTranslationPage) {
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
      {listResult.data.map((translation) => (
        <SidebarItem
          actions={[
            {
              type: "delete",
              onClick: () => handleDelete(translation.id),
              title: fa.sidebar.actions.delete,
            },
          ]}
          key={translation.id}
          params={{ translationId: String(translation.id) }}
          title={
            translation.sourceFileName ||
            translation.sourceText?.slice(0, 30) ||
            fa.general.untitled
          }
          to="/translation/$translationId"
        />
      ))}
    </>
  );
}

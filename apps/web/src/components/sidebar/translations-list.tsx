import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";
import { SidebarItem, useTranslationMutations } from "./base";
import { TranslationEmptyState } from "./empty-state";

export function TranslationsList() {
  const location = useLocation();
  const isTranslationPage = location.pathname.startsWith("/translation");

  const mutations = useTranslationMutations();

  const listQuery = useQuery({
    ...orpc.translations.list.queryOptions(),
    enabled: isTranslationPage,
  });

  const handleDelete = (id: number) => {
    mutations.delete.mutate(id);
  };

  if (!isTranslationPage) {
    return null;
  }

  if (!listQuery.data?.length) {
    return <TranslationEmptyState />;
  }

  return (
    <>
      {listQuery.data.map((translation) => (
        <SidebarItem
          actions={[
            {
              type: "delete",
              onClick: () => handleDelete(translation.id),
              title: "حذف",
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

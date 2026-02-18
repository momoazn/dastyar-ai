import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { getEnabledNavItems, navMain } from "./nav";

export function useEnabledNavItems() {
  const { data: toggles } = useQuery(
    orpc.appConfig.getFeatureToggles.queryOptions({
      staleTime: 30_000,
      meta: { suppressErrorToast: true },
    })
  );

  return getEnabledNavItems(navMain, toggles);
}

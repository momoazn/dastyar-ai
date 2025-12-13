import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { logoutAtom, tokenAtom } from "@/atoms/auth";
import type { User } from "@/types/database";
import { orpc } from "@/utils/orpc";

export function useUser() {
  const token = useAtomValue(tokenAtom);
  const [, logout] = useAtom(logoutAtom);

  return useQuery(
    orpc.auth.me.queryOptions({
      enabled: !!token,
      staleTime: 5 * 60_000,
      retry: false,
      onError: () => logout(),
    })
  );
}

import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { logoutAtom, tokenAtom } from "@/atoms/auth";
import { orpc } from "@/utils/orpc";

export function useUser() {
  const token = useAtomValue(tokenAtom);
  const [, logout] = useAtom(logoutAtom);

  const query = useQuery(
    orpc.auth.me.queryOptions({
      enabled: !!token,
      staleTime: 5 * 60_000,
      retry: (failureCount, error: unknown) => {
        // Only retry on network errors, not on auth errors
        const isAuthError =
          error instanceof ORPCError &&
          (error.status === 401 || error.code === "MISSING_AUTH_HEADER");
        return !isAuthError && failureCount < 3;
      },
    })
  );

  useEffect(() => {
    if (
      query.error instanceof ORPCError &&
      (query.error.status === 401 || query.error.code === "MISSING_AUTH_HEADER")
    ) {
      logout();
    }
  }, [query.error, logout]);

  return query;
}

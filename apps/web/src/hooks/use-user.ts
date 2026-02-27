import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { logoutAtom, tokenAtom } from "@/atoms/auth";
import { orpc } from "@/utils/orpc";

export function useUser() {
  const token = useAtomValue(tokenAtom);
  const [, logout] = useAtom(logoutAtom);

  return useQuery(
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
      onError: (error: unknown) => {
        // Only logout on authentication errors
        const isAuthError =
          error instanceof ORPCError &&
          (error.status === 401 || error.code === "MISSING_AUTH_HEADER");
        if (isAuthError) {
          logout();
        }
      },
    })
  );
}

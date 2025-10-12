import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/atoms/auth";
import { orpc } from "@/utils/orpc";

export type User = {
  id: number;
  username: string;
  role: "admin" | "user";
};

export function useUser() {
  const token = useAtomValue(tokenAtom);

  return useQuery(
    orpc.auth.me.queryOptions({
      enabled: !!token,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry if token is invalid
        if (error instanceof Error && error.message.includes("token")) {
          return false;
        }
        return failureCount < 3;
      },
    })
  );
}

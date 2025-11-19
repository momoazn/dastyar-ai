import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LS_TOKEN_KEY } from "@/atoms/auth";
import type { appRouter } from "@/server/procedures";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Skip toast for queries that suppress error toasts
      if (query.meta?.suppressErrorToast) {
        return;
      }
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Construct absolute URL from relative path using current origin
// Works in both dev (Vite proxy) and prod (same origin)
const getRpcUrl = (): string => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/rpc`;
  }
  // Fallback for SSR (shouldn't happen in this app)
  return "/rpc";
};

export const link = new RPCLink({
  url: getRpcUrl(),
  headers: () => {
    const rawValue = localStorage.getItem(LS_TOKEN_KEY);
    if (!rawValue) {
      return {};
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      parsed = rawValue;
    }

    const token = typeof parsed === "string" ? parsed : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export type OrpcClient = RouterClient<typeof appRouter>;
export const client: OrpcClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

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
    onError: (error) => {
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

export const link = new RPCLink({
  url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
  headers: () => {
    const token = JSON.parse(localStorage.getItem(LS_TOKEN_KEY) || "null");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export type OrpcClient = RouterClient<typeof appRouter>;
export const client: OrpcClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

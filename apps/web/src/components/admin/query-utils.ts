import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

type UserListParams = {
  page: number;
  pageSize: number;
  search?: string;
  role?: "admin" | "user";
};

const buildUserListInput = (params: UserListParams) => ({
  page: params.page,
  pageSize: params.pageSize,
  ...(params.search ? { search: params.search } : {}),
  ...(params.role ? { role: params.role } : {}),
});

export const invalidateAdminModels = async (queryClient: QueryClient) =>
  await queryClient.invalidateQueries({
    queryKey: orpc.admin.listAllModels.queryKey(),
  });

export const invalidateAdminOllamaServers = async (queryClient: QueryClient) =>
  await queryClient.invalidateQueries({
    queryKey: orpc.admin.listOllamaServers.queryKey(),
  });

export const invalidateAdminUsers = async (
  queryClient: QueryClient,
  params?: UserListParams
) => {
  if (params) {
    await queryClient.invalidateQueries({
      queryKey: orpc.admin.listUsers.queryKey({
        input: buildUserListInput(params),
      }),
    });
    return;
  }

  const baseQueryKey = orpc.admin.listUsers.queryKey({
    input: { page: 1, pageSize: 10 },
  });

  await queryClient.invalidateQueries({
    queryKey: baseQueryKey.slice(0, 2),
    exact: false,
  });
};

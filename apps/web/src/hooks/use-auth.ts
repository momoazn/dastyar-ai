import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
  authAtom,
  isLoadingAtom,
  tokenAtom,
  type User,
  userAtom,
} from '@/atoms/auth';
import { client, orpc } from '@/utils/orpc';

export function useAuth() {
  const [authState, setAuthState] = useAtom(authAtom);
  const [, setToken] = useAtom(tokenAtom);
  const [, setUser] = useAtom(userAtom);
  const [, setIsLoading] = useAtom(isLoadingAtom);
  const queryClient = useQueryClient();

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
    });
    // Clear all cached queries
    queryClient.clear();
  };

  const loginMutation = useMutation({
    ...orpc.auth.login.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        setUser(result.user);
        setAuthState({
          user: result.user,
          token: result.token,
          isLoading: false,
        });
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  });

  const registerMutation = useMutation({
    ...orpc.auth.register.mutationOptions({
      onSuccess: (result) => {
        setToken(result.token);
        setUser(result.user);
        setAuthState({
          user: result.user,
          token: result.token,
          isLoading: false,
        });
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  });

  const authQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: (): Promise<User> => {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('No token found');
      }
      return client.auth.me();
    },
    enabled: !!localStorage.getItem('auth-token') && !authState.user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle successful auth query
  if (authQuery.data && !authState.user) {
    const token = localStorage.getItem('auth-token');
    if (token) {
      setUser(authQuery.data);
      setToken(token);
      setAuthState({
        user: authQuery.data,
        token,
        isLoading: false,
      });
    }
  }

  // Handle auth query error (invalid token)
  if (authQuery.error && authState.user) {
    logout();
  }

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: !!authState.user,
    isLoading: authState.isLoading || authQuery.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout,
    checkAuth: authQuery.refetch,
    loginState: {
      isLoading: loginMutation.isPending,
      error: loginMutation.error,
      isSuccess: loginMutation.isSuccess,
    },
    registerState: {
      isLoading: registerMutation.isPending,
      error: registerMutation.error,
      isSuccess: registerMutation.isSuccess,
    },
    authState: {
      isLoading: authQuery.isLoading,
      error: authQuery.error,
      isSuccess: authQuery.isSuccess,
      data: authQuery.data,
    },
  };
}

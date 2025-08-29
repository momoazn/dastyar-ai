import '@fontsource-variable/vazirmatn';
import '../index.css';

import { createORPCClient } from '@orpc/client';
import type { RouterClient } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import Loader from '@/components/loader';
import { ThemeProvider } from '@/components/theme-provider';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { fa } from '@/lib/persian-texts';
import type { appRouter } from '@/server/api/procedures';
import { link, type orpc } from '@/utils/orpc';

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    title: fa.navigation.appTitle,
    meta: [
      {
        name: 'description',
        content: fa.navigation.appTitle,
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });

  const [client] = useState<RouterClient<typeof appRouter>>(() =>
    createORPCClient(link)
  );
  const [_orpcUtils] = useState(() => createTanstackQueryUtils(client));

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <SidebarProvider
          style={
            {
              '--sidebar-width': '350px',
            } as React.CSSProperties
          }
        >
          <AppSidebar side="right" />
          <SidebarInset>
            <div className="grid h-svh grid-rows-[auto_1fr]">
              <Header SideBarTrigger={<SidebarTrigger />} />
              {isFetching ? <Loader /> : <Outlet />}
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
    </>
  );
}

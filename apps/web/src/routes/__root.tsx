import "@fontsource-variable/vazirmatn";
import "../index.css";

import { createORPCClient } from "@orpc/client";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useLocation,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Loader from "@/components/chat/loader";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { fa } from "@/lib/persian-texts";
import type { appRouter } from "@/server/procedures";
import { link, type orpc } from "@/utils/orpc";

export type RouterAppContext = {
  orpc: typeof orpc;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    title: fa.navigation.appTitle,
    meta: [
      {
        name: "description",
        content: fa.navigation.appTitle,
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
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
        <Wrapper>{isFetching ? <Loader /> : <Outlet />}</Wrapper>
        <Toaster position="bottom-left" richColors />
      </ThemeProvider>
      {/* <TanStackRouterDevtools position="bottom-left" /> */}
      {/* <ReactQueryDevtools buttonPosition="relative" position="bottom" /> */}
    </>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/admin")
  ) {
    return children;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "300px",
        } as React.CSSProperties
      }
    >
      <AppSidebar side="right" />
      <SidebarInset className="bg-sidebar pe-2 pb-2">
        <Header SideBarTrigger={<SidebarTrigger />} />
        <div className="flex h-full flex-col rounded-md border bg-background p-2">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

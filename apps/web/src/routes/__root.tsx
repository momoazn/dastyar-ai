import "@fontsource-variable/vazirmatn";
import "../index.css";

import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useLocation,
  useRouterState,
} from "@tanstack/react-router";
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
import { IS_DEMO } from "@/demo/mode";
import { fa } from "@/lib/texts";
import type { orpc } from "@/utils/orpc";

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
      {
        rel: "icon",
        href: "/brand-logo.svg",
        type: "image/svg+xml",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });

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
        {IS_DEMO && (
          <div className="-translate-x-1/2 pointer-events-none fixed top-2 left-1/2 z-50 rounded-full bg-amber-100 px-3 py-1 text-amber-900 text-xs shadow">
            نسخه‌ی دمو: پاسخ‌ها از پیش نوشته شده‌اند و مدلی اجرا نمی‌شود.
          </div>
        )}
      </ThemeProvider>
    </>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // The landing page has its own full-width layout without the app shell.
  if (location.pathname === "/") {
    return children;
  }

  const isAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-sidebar">
        <Header />
        <div className="container mx-auto">{children}</div>
      </div>
    );
  }

  return (
    <SidebarProvider
      className="h-dvh bg-sidebar"
      style={
        {
          "--sidebar-width": "300px",
        } as React.CSSProperties
      }
    >
      <AppSidebar side="right" />
      <SidebarInset className="min-w-0 bg-sidebar ps-2 pb-2">
        <Header SideBarTrigger={<SidebarTrigger />} />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-md border bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

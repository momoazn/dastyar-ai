import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Header } from "../header";

// import { Header, Sidebar } from "@/components";

const HomePage = lazy(() => import("../../pages/home"));
const ChatPage = lazy(() => import("../../pages/chat"));
const ImagePage = lazy(() => import("../../pages/image"));
const TranslationPage = lazy(() => import("../../pages/translation"));

const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/chat", element: <ChatPage /> },
  { path: "/chat/:id", element: <ChatPage /> },
  { path: "/image", element: <ImagePage /> },
  { path: "/translation", element: <TranslationPage /> },
  { path: "/translation/:id", element: <TranslationPage /> },
] as const;

export function MainLayout() {
  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "350px",
          } as React.CSSProperties
        }
      >
        <AppSidebar side="right" />
        <SidebarInset>
          <Header SideBarTrigger={<SidebarTrigger />} />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Routes>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

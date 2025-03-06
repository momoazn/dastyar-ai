import { lazy, useState } from "react";
import { Routes, Route } from "react-router-dom";

import { Header } from "../header";
import { Sidebar } from "../sidebar";
import { Navigation } from "../navigation";
import { useInitializeSelectedModels } from "@/hooks/use-chat-model";

const ChatPage = lazy(() =>
  import("../../pages/chat").then((module) => ({ default: module.ChatPage })),
);
const ImagePage = lazy(() =>
  import("../../pages/image").then((module) => ({ default: module.ImagePage })),
);
const TranslationPage = lazy(() =>
  import("../../pages/translation").then((module) => ({
    default: module.TranslationPage,
  })),
);

export function MainLayout() {
  useInitializeSelectedModels();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.innerWidth >= 768;
  });

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Navigation />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/image" element={<ImagePage />} />
            <Route path="/translate" element={<TranslationPage />} />
            <Route path="/threads/:threadID/chat" element={<ChatPage />} />
            <Route path="/threads/:threadID/image" element={<ImagePage />} />
            <Route
              path="/threads/:threadID/translate"
              element={<TranslationPage />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

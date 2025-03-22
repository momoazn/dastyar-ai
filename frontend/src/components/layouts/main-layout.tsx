import { lazy, useState } from "react";
import { Route, Routes } from "react-router-dom";

import { Header, Sidebar } from "@/components";
import { useInitializeSelectedModels } from "@/hooks";

const HomePage = lazy(() =>
  import("../../pages/home").then((module) => ({ default: module.HomePage })),
);
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
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <section className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
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
        </section>
      </main>
    </div>
  );
}

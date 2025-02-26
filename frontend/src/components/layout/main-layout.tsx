import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "../header";
import { Sidebar } from "../sidebar";
import { Navigation } from "../navigation";
import { ChatPage, ImagePage, TranslationPage } from "../../pages";
import { useInitializeChatModel } from "@/hooks/use-chat-model";

export function MainLayout() {
  useInitializeChatModel();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isSidebarOpen={isSidebarOpen} />
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import { useGetSelectedChatModel, useSetSelectedChatModel } from "./atoms";
import { Header } from "./components/header";
import { Sidebar } from "./components/sidebar";
import { useChatModels } from "./lib/api/chat";
import { PERSIAN_TEXTS } from "./lib/persian-texts";
import { ChatPage, ImagePage, TranslationPage } from "./pages";

const queryClient = new QueryClient();

const NAV_LINKS = [
  { to: "/chat", label: PERSIAN_TEXTS.navigation.chat },
  { to: "/image", label: PERSIAN_TEXTS.navigation.imageGeneration },
  { to: "/translate", label: PERSIAN_TEXTS.navigation.translation },
];

function MainContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const selectedChatModel = useGetSelectedChatModel();
  const setSelectedChatModel = useSetSelectedChatModel();

  const { data: chatModels } = useChatModels();

  useEffect(() => {
    if (chatModels?.data && !Boolean(selectedChatModel)) {
      setSelectedChatModel(chatModels.data[0].name);
    }
  }, [chatModels, selectedChatModel, setSelectedChatModel]);

  return (
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <nav className="flex h-16 items-center border-b border-border px-4">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-md rounded-md px-6 py-2 ${
                  isActive ? "bg-primary/10 text-primary" : ""
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/image" element={<ImagePage />} />
            <Route path="/translate" element={<TranslationPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <MainContent />
      </div>
    </QueryClientProvider>
  );
}

export default App;

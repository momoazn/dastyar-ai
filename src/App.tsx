import { NavLink, Route, Routes } from "react-router-dom";
import { ChatSection } from "./components/chat-section";
import { Header } from "./components/header";
import { ImageSection } from "./components/image-section";
import { TranslationSection } from "./components/translation-section";
import { Sidebar } from "./components/sidebar";
import { ServiceProvider, useServices } from "./context/service-context";

function MainContent() {
  const { connectionsStatus } = useServices();

  return (
    <>
      <Sidebar />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <Header connectionsStatus={connectionsStatus} />
        <nav className="flex h-16 items-center border-b border-border px-4">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `text-md rounded-md px-6 py-2 ${
                isActive ? "bg-primary/10 text-primary" : ""
              }`
            }
          >
            گفتگو
          </NavLink>
          <NavLink
            to="/image"
            className={({ isActive }) =>
              `text-md rounded-md px-6 py-2 ${
                isActive ? "bg-primary/10 text-primary" : ""
              }`
            }
          >
            تولید تصویر
          </NavLink>
          <NavLink
            to="/translate"
            className={({ isActive }) =>
              `text-md rounded-md px-6 py-2 ${
                isActive ? "bg-primary/10 text-primary" : ""
              }`
            }
          >
            ترجمه
          </NavLink>
        </nav>

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ChatSection />} />
            <Route path="/chat" element={<ChatSection />} />
            <Route path="/image" element={<ImageSection />} />
            <Route path="/translate" element={<TranslationSection />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <ServiceProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <MainContent />
      </div>
    </ServiceProvider>
  );
}

export default App;

import { useState } from "react";
import { ChatSection } from "./components/ChatSection";
import { ImageSection } from "./components/ImageSection";
import { Sidebar } from "./components/Sidebar";
import { ServiceProvider } from "./context/ServiceContext";

function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat");

  return (
    <ServiceProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {activeTab === "chat" ? <ChatSection /> : <ImageSection />}
          </div>
        </div>
      </div>
    </ServiceProvider>
  );
}

export default App;

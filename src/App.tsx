import { useRef, useState } from "react";
import { ChatSection } from "./components/ChatSection";
import { ImageSection } from "./components/ImageSection";
import { Sidebar } from "./components/Sidebar";
import { useServices } from "./hooks/useServices";
import { OllamaService } from "./services/ollama";
import { StableDiffusionService } from "./services/stableDiffusion";

function App() {
  const ollamaService = useRef(new OllamaService());
  const sdService = useRef(new StableDiffusionService());
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat");
  const [connectionsStatus, ollamaModels] = useServices(
    ollamaService.current,
    sdService.current,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionsStatus={connectionsStatus}
      />

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab === "chat" ? (
            <ChatSection
              ollamaService={ollamaService.current}
              ollamaModels={ollamaModels}
            />
          ) : (
            <ImageSection sdService={sdService.current} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import { ImageIcon, MessageSquare } from "lucide-react";
import { act, useRef, useState } from "react";
import { ChatSection } from "./components/ChatSection";
import { Status } from "./components/Status";
import { ImageSection } from "./components/ImageSection";
import { useServices } from "./hooks/useServices";
import { OllamaService } from "./services/ollama";
import { StableDiffusionService } from "./services/stableDiffusion";
import { Sidebar } from "./components/Sidebar";

function App() {
  const ollamaService = useRef(new OllamaService());
  const sdService = useRef(new StableDiffusionService());
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat");
  const [connectionsStatus, ollamaModels] = useServices(
    ollamaService.current,
    sdService.current
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionsStatus={connectionsStatus}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
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

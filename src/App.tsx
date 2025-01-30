import { useState } from "react";
import { ChatSection } from "./components/ChatSection";
import { ImageSection } from "./components/ImageSection";
import { ServiceProvider, useServices } from "./context/ServiceContext";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Status } from "./components/Status";

function MainContent() {
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat");
  const { connectionsStatus } = useServices();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "chat" | "image")}
        className="border-b border-border"
      >
        <TabsList className="h-16 w-full rounded-none bg-background px-4">
          <TabsTrigger
            value="chat"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            گفتگو
          </TabsTrigger>
          <TabsTrigger
            value="image"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            تولید تصویر
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-auto">
        {activeTab === "chat" ? <ChatSection /> : <ImageSection />}
      </div>

      <div className="border-t border-border p-4">
        <Status connectionsStatus={connectionsStatus} />
      </div>
    </div>
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

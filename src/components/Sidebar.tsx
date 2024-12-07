import { ConnectionStatus } from "@/hooks/useServices";
import { ImageIcon, MessageSquare } from "lucide-react";
import { Dispatch } from "react";
import { Status } from "./Status";

export const Sidebar: React.FC<{
  activeTab: "chat" | "image";
  setActiveTab: Dispatch<"chat" | "image">;
  connectionsStatus: ConnectionStatus;
}> = ({ activeTab, setActiveTab, connectionsStatus }) => {
  return (
    <div className="w-20 lg:w-64 border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-primary hidden lg:block">
          دستیار هوشمند
        </h1>
        <div className="lg:hidden flex justify-center">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            AI
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`w-full p-2 rounded-lg flex items-center gap-3 transition-colors ${
            activeTab === "chat"
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden lg:block">گفتگو</span>
        </button>
        <button
          onClick={() => setActiveTab("image")}
          className={`w-full p-2 rounded-lg flex items-center gap-3 transition-colors ${
            activeTab === "image"
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent"
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="hidden lg:block">تولید تصویر</span>
        </button>
      </nav>

      <div className="p-4 border-t border-border">
        <Status connectionsStatus={connectionsStatus} />
      </div>
    </div>
  );
};

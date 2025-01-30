import { useServices } from "@/context/service-context";
import { ImageIcon, MessageSquare } from "lucide-react";
import { Dispatch } from "react";
import { Status } from "./status";

export const Sidebar: React.FC<{
  activeTab: "chat" | "image";
  setActiveTab: Dispatch<"chat" | "image">;
}> = ({ activeTab, setActiveTab }) => {
  const { connectionsStatus } = useServices();

  return (
    <div className="flex w-20 flex-col border-l border-border lg:w-64">
      <div className="border-b border-border p-4">
        <h1 className="hidden text-2xl font-bold text-primary lg:block">
          دستیار هوشمند
        </h1>
        <div className="flex justify-center lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            AI
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex w-full items-center gap-3 rounded-lg p-2 transition-colors ${
            activeTab === "chat"
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="hidden lg:block">گفتگو</span>
        </button>
        <button
          onClick={() => setActiveTab("image")}
          className={`flex w-full items-center gap-3 rounded-lg p-2 transition-colors ${
            activeTab === "image"
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent"
          }`}
        >
          <ImageIcon className="h-5 w-5" />
          <span className="hidden lg:block">تولید تصویر</span>
        </button>
      </nav>

      <div className="border-t border-border p-4">
        <Status connectionsStatus={connectionsStatus} />
      </div>
    </div>
  );
};

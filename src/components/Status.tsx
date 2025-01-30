import { ConnectionStatus } from "@/context/service-context";
import { Brain, CloudIcon, ImageIcon } from "lucide-react";

export const Status: React.FC<{ connectionsStatus: ConnectionStatus }> = ({
  connectionsStatus,
}) => {
  return (
    <header className="flex flex-col gap-2">
      <div
        className={`flex items-center gap-2 rounded px-2 py-1.5 ${
          connectionsStatus.ollama
            ? "bg-green-500/10 text-green-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        <Brain className="h-4 w-4" />
        <span className="hidden text-xs lg:block">Ollama</span>
      </div>
      <div
        className={`flex items-center gap-2 rounded px-2 py-1.5 ${
          connectionsStatus.whisper
            ? "bg-green-600/10 text-green-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        <CloudIcon className="h-4 w-4" />
        <span className="hidden text-xs lg:block">Whisper</span>
      </div>
      <div
        className={`flex items-center gap-2 rounded px-2 py-1.5 ${
          connectionsStatus.stableDiffusion
            ? "bg-green-500/10 text-green-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="hidden text-xs lg:block">Stable Diffusion</span>
      </div>
    </header>
  );
};

import { Brain, CloudIcon, ImageIcon } from "lucide-react";
import { ConnectionStatus } from "../hooks/useServices";

export const Status: React.FC<{ connectionsStatus: ConnectionStatus }> = ({
  connectionsStatus,
}) => {
  return (
    <header className="gap-2 flex flex-col">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded ${
          connectionsStatus.ollama
            ? "text-green-400 bg-green-500/10"
            : "text-red-400 bg-red-500/10"
        }`}
      >
        <Brain className="w-4 h-4" />
        <span className="text-xs hidden lg:block">Ollama</span>
      </div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded ${
          connectionsStatus.whisper
            ? "text-green-400 bg-green-600/10"
            : "text-red-400 bg-red-500/10"
        }`}
      >
        <CloudIcon className="w-4 h-4" />
        <span className="text-xs hidden lg:block">Whisper</span>
      </div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded ${
          connectionsStatus.stableDiffusion
            ? "text-green-400 bg-green-500/10"
            : "text-red-400 bg-red-500/10"
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        <span className="text-xs hidden lg:block">Stable Diffusion</span>
      </div>
    </header>
  );
};

import { motion } from "framer-motion";
import { Brain, CloudIcon, ImageIcon, Sparkles } from "lucide-react";
import { ConnectionStatus } from "../hooks/useServices";

export const Header: React.FC<{ connectionsStatus: ConnectionStatus }> = ({
  connectionsStatus,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between rtl">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-blue-500" />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              دستیار هوش مصنوعی
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
              <Brain
                className={
                  connectionsStatus.ollama ? "text-green-500" : "text-red-500"
                }
              />
              <span className="text-sm">Ollama</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
              <CloudIcon
                className={
                  connectionsStatus.whisper ? "text-green-500" : "text-red-500"
                }
              />
              <span className="text-sm">Whisper</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
              <ImageIcon
                className={
                  connectionsStatus.stableDiffusion
                    ? "text-green-500"
                    : "text-red-500"
                }
              />
              <span className="text-sm">Stable Diffusion</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

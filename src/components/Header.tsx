import React from "react";
import { Brain, ImageIcon, Sparkles } from "lucide-react";
import { useStore } from "../store/useStore";
import { motion } from "framer-motion";

export const Header: React.FC = () => {
  const connectionStatus = useStore((state) => state.connectionStatus);

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
            <span className="text-sm text-gray-500">قدرت گرفته از</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
              <Brain
                className={
                  connectionStatus.ollama ? "text-green-500" : "text-red-500"
                }
              />
              <span className="text-sm">Ollama</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
              <ImageIcon
                className={
                  connectionStatus.stableDiffusion
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

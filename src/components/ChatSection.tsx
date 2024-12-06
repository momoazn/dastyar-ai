import React, { useState } from "react";
import { Mic, Send } from "lucide-react";
import { useStore } from "../store/useStore";
import { motion } from "framer-motion";

export const ChatSection: React.FC = () => {
  const [message, setMessage] = useState("");
  const { recording, setRecording, audioLevel } = useStore();

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: Implement message sending
    setMessage("");
  };

  return (
    <div className="p-6">
      <div className="h-[500px] overflow-y-auto mb-4 border rounded-md bg-gray-50 p-4">
        {/* Chat messages will go here */}
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-md transition-colors ${
            recording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setRecording(!recording)}
        >
          <Mic className="w-5 h-5" />
        </motion.button>
        {recording && (
          <div className="flex-1 h-2 bg-gray-200 rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${audioLevel}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="پیام خود را بنویسید..."
            dir="rtl"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={handleSend}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

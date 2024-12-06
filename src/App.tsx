import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, MessageSquare } from "lucide-react";
import { useState } from "react";
import { ChatSection } from "./components/ChatSection";
import { Header } from "./components/Header";
import { ImageSection } from "./components/ImageSection";
import { useServices } from "./hooks/useServices";

function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat");
  useServices();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex rtl" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 ${
                  activeTab === "chat"
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>گفتگو با هوش مصنوعی</span>
                </div>
                {activeTab === "chat" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("image")}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 ${
                  activeTab === "image"
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>تولید تصویر</span>
                </div>
                {activeTab === "image" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            </nav>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "chat" ? <ChatSection /> : <ImageSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;

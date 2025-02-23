import { useState, useEffect } from "react";

export interface ChatSettings {
  baseUrl: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

const defaultSettings: ChatSettings = {
  baseUrl: "http://localhost:11434",
  systemPrompt: `You are a helpful Persian AI assistant. Please follow these guidelines:
1. Be concise and direct in your responses
2. If you're not sure about something, admit it
3. When providing code examples, make sure they are complete and runnable
4. Use respectful and professional language
5. If the question is in Persian, respond in Persian. If in English, respond in English
6. For technical questions, provide accurate and up-to-date information
7. Format code blocks properly using markdown`,
  temperature: 0.7,
  topP: 0.9,
  presencePenalty: 0,
  frequencyPenalty: 0,
};

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem("chatSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("chatSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
} 
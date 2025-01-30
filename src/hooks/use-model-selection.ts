import { useServices } from "@/context/service-context";
import { useEffect, useState } from "react";

export const useModelSelection = () => {
  const { ollamaModels, whisperModels } = useServices();

  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>("");
  const [selectedWhisperModel, setSelectedWhisperModel] = useState<string>("");

  useEffect(() => {
    const savedOllamaModel = localStorage.getItem("ollamaModel");
    const savedWhisperModel = localStorage.getItem("whisperModel");
    
    if (savedOllamaModel) setSelectedOllamaModel(savedOllamaModel);
    else setSelectedOllamaModel(ollamaModels?.[0] ?? "");

    if (savedWhisperModel) setSelectedWhisperModel(savedWhisperModel);
    else setSelectedWhisperModel(whisperModels?.[0] ?? "");
  }, [ollamaModels, whisperModels]);

  const handleOllamaModelSelect = (model: string) => {
    setSelectedOllamaModel(model);
    localStorage.setItem("ollamaModel", model);
  };

  const handleWhisperModelSelect = (model: string) => {
    setSelectedWhisperModel(model);
    localStorage.setItem("whisperModel", model);
  };

  return {
    selectedOllamaModel,
    selectedWhisperModel,
    setOllamaModel: handleOllamaModelSelect,
    setWhisperModel: handleWhisperModelSelect,
  };
};

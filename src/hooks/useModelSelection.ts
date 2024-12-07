import { useEffect, useState } from "react";

export const useModelSelection = (initialModels?: string[]) => {
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    const savedModel = localStorage.getItem("ollamaModel");
    if (savedModel) setSelectedModel(savedModel);
    else setSelectedModel(initialModels?.[0] ?? "");
  }, [initialModels]);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("ollamaModel", model);
  };

  return {
    selectedModel,
    setModel: handleModelSelect,
  };
};

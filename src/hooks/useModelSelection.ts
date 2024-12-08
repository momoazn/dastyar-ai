import { useServices } from "@/context/ServiceContext";
import { useEffect, useState } from "react";

export const useModelSelection = () => {
  const { ollamaModels } = useServices();

  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    const savedModel = localStorage.getItem("ollamaModel");
    if (savedModel) setSelectedModel(savedModel);
    else setSelectedModel(ollamaModels?.[0] ?? "");
  }, [ollamaModels]);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("ollamaModel", model);
  };

  return {
    selectedModel,
    setModel: handleModelSelect,
  };
};

import { useQuery } from "@tanstack/react-query";
import { Ollama } from "ollama/browser";

export const useModelsList = () => {
  const ollama = new Ollama();

  return useQuery({
    queryKey: ["ollama-models"],
    queryFn: async () => {
      const res = await ollama.list();
      return res.models;
    },
    refetchInterval: 5000,
  });
};

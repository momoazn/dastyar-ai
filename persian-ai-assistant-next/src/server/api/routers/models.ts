import { TRPCError } from "@trpc/server";
import { Ollama } from "ollama";
import { createTRPCRouter, publicProcedure } from "../trpc";

const ollama = new Ollama();

export const modelsRouter = createTRPCRouter({
  // List available Ollama models
  list: publicProcedure.query(async () => {
    try {
      const modelsList = await ollama.list();

      return { models: modelsList.models };
    } catch (error) {
      console.error("Error fetching Ollama models:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to connect to Ollama. Make sure Ollama is running.",
      });
    }
  }),
});

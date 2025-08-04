import { LM_STUDIO_BASE_URL, providers } from "@/server/providers";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const modelsRouter = createTRPCRouter({
  getModels: publicProcedure.query(async ({ ctx }) => {
    const models = await fetch(`${LM_STUDIO_BASE_URL}/models`);
    return models;
  }),
});

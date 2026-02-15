import { adminProcedures } from "./admin";
import { appConfigProcedures } from "./app-config";
import { authProcedures } from "./auth";
import { codeProcedures } from "./code";
import { documentProcedures } from "./documents";
import { healthProcedures } from "./health";
import { imageThreadProcedures } from "./image-threads";
import { imageProcedures } from "./images";
import { llmModelProcedures } from "./llm-models";
import { messageProcedures } from "./messages";
import { summarizeProcedures } from "./summarize";
import { threadProcedures } from "./threads";
import { transcribeProcedures } from "./transcribe";
import { translationProcedures } from "./translation";

export const appRouter = {
  ...healthProcedures,
  auth: authProcedures,
  admin: adminProcedures,
  appConfig: appConfigProcedures,
  models: llmModelProcedures,
  threads: threadProcedures,
  messages: messageProcedures,
  translations: translationProcedures,
  transcribe: transcribeProcedures,
  summarize: summarizeProcedures,
  images: imageProcedures,
  imageThreads: imageThreadProcedures,
  code: codeProcedures,
  documents: documentProcedures,
};

export type AppRouter = typeof appRouter;

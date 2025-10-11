import { codeProcedures } from './code';
import { healthProcedures } from './health';
import { imageThreadProcedures } from './image-threads';
import { imageProcedures } from './images';
import { llmModelProcedures } from './llm-models';
import { summarizeProcedures } from './summarize';
import { messageProcedures, threadProcedures } from './threads';
import { transcribeProcedures } from './transcribe';
import { translationProcedures } from './translation';

export const appRouter = {
  ...healthProcedures,
  models: llmModelProcedures,
  threads: threadProcedures,
  messages: messageProcedures,
  translations: translationProcedures,
  transcribe: transcribeProcedures,
  summarize: summarizeProcedures,
  images: imageProcedures,
  imageThreads: imageThreadProcedures,
  code: codeProcedures,
};

export type AppRouter = typeof appRouter;

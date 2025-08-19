import { healthProcedures } from './health';
import { imageProcedures } from './images';
import { modelProcedures } from './models';
import { summarizeProcedures } from './summarize';
import { messageProcedures, threadProcedures } from './threads';
import { transcribeProcedures } from './transcribe';
import { translationProcedures } from './translation';

export const appRouter = {
  ...healthProcedures,
  models: modelProcedures,
  threads: threadProcedures,
  messages: messageProcedures,
  translations: translationProcedures,
  transcribe: transcribeProcedures,
  summarize: summarizeProcedures,
  images: imageProcedures,
};

export type AppRouter = typeof appRouter;

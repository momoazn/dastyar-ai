import { healthProcedures } from './health';
import { modelProcedures } from './models';
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
};

export type AppRouter = typeof appRouter;

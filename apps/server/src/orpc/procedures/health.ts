import { publicProcedure } from '../index';

export const healthProcedures = {
  healthCheck: publicProcedure.handler(() => {
    return 'OK';
  }),
};

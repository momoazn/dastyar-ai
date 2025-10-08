import { listAllModels } from '@/services';
import { publicProcedure } from './base';

export const modelProcedures = {
  list: publicProcedure.handler(async () => {
    try {
      return await listAllModels();
    } catch (error) {
      console.error('error listing models', error);
      throw error;
    }
  }),
};

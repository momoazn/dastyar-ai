import { publicProcedure } from '@/api/index';
import { listAllModels } from '@/services';

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

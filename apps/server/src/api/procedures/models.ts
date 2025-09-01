import { publicProcedure } from '@/api/index';
import { listAllModels } from '@/services/ai-providers';

export const modelProcedures = {
  list: publicProcedure.handler(async () => {
    console.log('listing models');
    try {
      return await listAllModels();
    } catch (error) {
      console.error('error listing models', error);
      throw error;
    }
  }),
};

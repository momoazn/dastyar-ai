import { listAllModels } from '@/services';
import { publicProcedure } from './base';

export const modelProcedures = {
  list: publicProcedure.handler(async () => {
    try {
      const models = await listAllModels();
      console.log('models', models);
      return models;
    } catch (error) {
      console.error('error listing models', error);
      throw error;
    }
  }),
};

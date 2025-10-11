import { publicProcedure } from "./base";

export const healthProcedures = {
  healthCheck: publicProcedure.handler(() => "OK"),
};

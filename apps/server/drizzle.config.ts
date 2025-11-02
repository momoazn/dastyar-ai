import { defineConfig } from "drizzle-kit";
import { env } from "./src/config";

export default defineConfig({
  schema: "./src/database/schema",
  out: "./src/database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_FILE ?? "./data.db",
  },
});

import { defineConfig } from "drizzle-kit";
import { env } from "./src/config";

console.log("env.DATABASE_FILE", env.DATABASE_FILE);

export default defineConfig({
  schema: "./src/database/schema",
  out: "./src/database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_FILE ?? "./data.db",
  },
});

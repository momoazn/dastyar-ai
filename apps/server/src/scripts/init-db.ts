import { ensureDirectoriesExist } from "../config";
import { initializeDatabase } from "../database";

ensureDirectoriesExist();
initializeDatabase();
console.log("[database] init-db completed");

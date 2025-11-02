import { ensureDirectoriesExist } from "../config";
import { initializeDatabase } from "../database";

ensureDirectoriesExist();
initializeDatabase();

import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(import.meta.dirname, "..", "data", "data.db");

function truncateTables(dbPath: string) {
  console.log("Attempting to truncate tables...");
  let db: Database | null = null;
  try {
    db = new Database(dbPath);
    // Order matters due to foreign key constraints
    db.run(`
      DELETE FROM comments;
      DELETE FROM tasks;
      DELETE FROM users_projects;
      DELETE FROM projects;
      DELETE FROM users;
    `);
    console.log("Successfully truncated tables.");
  } catch (error) {
    console.error("Error truncating tables:", error);
    // Decide if seeding should continue or halt
    throw error; // Re-throw if truncation is critical
  } finally {
    db?.close();
  }
}

truncateTables(DB_PATH);

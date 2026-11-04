import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "./config";

// Point the database and storage dirs at a temp dir, so tests never touch
// the dev data. This file runs before any test file loads the db module.
const dir = mkdtempSync(join(tmpdir(), "dastyar-test-"));
env.DATABASE_FILE = join(dir, "data.db");
env.IMAGES_DIR = join(dir, "images");
env.DOCUMENTS_DIR = join(dir, "documents");

process.on("exit", () => {
  rmSync(dir, { recursive: true, force: true });
});

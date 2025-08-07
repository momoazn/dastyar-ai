import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

function resolveDatabasePath(): string {
	const envUrl = process.env.DATABASE_URL?.trim();
	if (envUrl && envUrl.length > 0) {
		// Support both file: and plain paths
		return envUrl.startsWith("file:") ? envUrl.replace(/^file:/, "") : envUrl;
	}
	// Dev-friendly fallback to local file database
	const filePath = resolve(process.cwd(), "apps/server/.data/local.db");
	const dir = dirname(filePath);
	try {
		mkdirSync(dir, { recursive: true });
	} catch {}
	return filePath;
}

const sqlite = new Database(resolveDatabasePath(), {
	create: true,
	strict: true,
});
export const db = drizzle(sqlite);
export { sqlite };

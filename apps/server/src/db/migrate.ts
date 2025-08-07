import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";

export async function runMigrations(): Promise<void> {
	// Support running from repo root or from the server app dir
	const candidates = [
		resolve(process.cwd(), "apps/server/src/db/migrations"),
		resolve(process.cwd(), "src/db/migrations"),
	];
	const migrationsFolder = candidates.find((p) => existsSync(p));
	if (!migrationsFolder) {
		return; // No migrations present, nothing to run in dev
	}

	await migrate(db, { migrationsFolder });
}

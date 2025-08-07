import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

function resolveDatabaseUrl(): string {
	const envUrl = process.env.DATABASE_URL?.trim();
	if (envUrl && envUrl.length > 0) return envUrl;
	// Dev-friendly fallback to local file database
	const filePath = resolve(process.cwd(), "apps/server/.data/local.db");
	const dir = dirname(filePath);
	try {
		mkdirSync(dir, { recursive: true });
	} catch {}
	return `file:${filePath}`;
}

const client = createClient({
	url: resolveDatabaseUrl(),
});

export const db = drizzle({ client });

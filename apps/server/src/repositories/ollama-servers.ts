import { and, eq, sql } from "drizzle-orm";
import { env } from "@/config";
import {
  db,
  type OllamaServer,
  ollamaServerModels,
  ollamaServers,
} from "@/database";

const DEFAULT_OLLAMA_SERVER_NAME = "Default Ollama";
const TRAILING_SLASH_RE = /\/+$/u;

const normalizeBaseUrl = (value: string): string =>
  value.trim().replace(TRAILING_SLASH_RE, "");

const dedupeStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!(trimmed && !seen.has(trimmed))) {
      continue;
    }
    seen.add(trimmed);
    deduped.push(trimmed);
  }
  return deduped;
};

export async function ensureDefaultOllamaServer(): Promise<OllamaServer | null> {
  if (!env.OLLAMA_ENABLED) {
    return null;
  }

  const existing = await db.select().from(ollamaServers).limit(1);
  if (existing.length > 0) {
    return existing[0] ?? null;
  }

  const baseUrl = normalizeBaseUrl(env.OLLAMA_BASE_URL);

  await db
    .insert(ollamaServers)
    .values({
      name: DEFAULT_OLLAMA_SERVER_NAME,
      baseUrl,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: ollamaServers.baseUrl })
    .run();

  const created = await db
    .select()
    .from(ollamaServers)
    .where(eq(ollamaServers.baseUrl, baseUrl))
    .limit(1);

  return created[0] ?? null;
}

export async function listOllamaServers(options?: {
  includeDisabled?: boolean;
  ensureDefault?: boolean;
}): Promise<OllamaServer[]> {
  const includeDisabled = options?.includeDisabled ?? true;
  const ensureDefault = options?.ensureDefault ?? true;

  if (ensureDefault) {
    await ensureDefaultOllamaServer();
  }

  const query = db.select().from(ollamaServers);
  if (includeDisabled) {
    return await query;
  }

  return await query.where(eq(ollamaServers.isEnabled, true));
}

export async function getOllamaServerById(
  id: number,
  options?: { ensureDefault?: boolean }
): Promise<OllamaServer | null> {
  if (options?.ensureDefault ?? true) {
    await ensureDefaultOllamaServer();
  }

  const result = await db
    .select()
    .from(ollamaServers)
    .where(eq(ollamaServers.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function createOllamaServer(input: {
  name: string;
  baseUrl: string;
  isEnabled?: boolean;
}): Promise<OllamaServer> {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const name = input.name.trim();

  await db
    .insert(ollamaServers)
    .values({
      name,
      baseUrl,
      isEnabled: input.isEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();

  const created = await db
    .select()
    .from(ollamaServers)
    .where(eq(ollamaServers.baseUrl, baseUrl))
    .limit(1);

  if (created.length === 0) {
    throw new Error("Unable to load Ollama server after creation");
  }

  return created[0];
}

export async function updateOllamaServer(
  id: number,
  input: Partial<Pick<OllamaServer, "name" | "baseUrl" | "isEnabled">>
): Promise<OllamaServer> {
  const updatePayload: Partial<typeof ollamaServers.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updatePayload.name = input.name.trim();
  }

  if (input.baseUrl !== undefined) {
    updatePayload.baseUrl = normalizeBaseUrl(input.baseUrl);
  }

  if (input.isEnabled !== undefined) {
    updatePayload.isEnabled = input.isEnabled;
  }

  await db
    .update(ollamaServers)
    .set(updatePayload)
    .where(eq(ollamaServers.id, id))
    .run();

  const updated = await getOllamaServerById(id, { ensureDefault: false });
  if (!updated) {
    throw new Error("Unable to load Ollama server after update");
  }

  return updated;
}

export async function deleteOllamaServer(id: number): Promise<void> {
  await db.delete(ollamaServers).where(eq(ollamaServers.id, id)).run();
}

export async function listOllamaServerModelIdentifiers(
  serverId: number
): Promise<string[]> {
  const rows = await db
    .select({ modelIdentifier: ollamaServerModels.modelIdentifier })
    .from(ollamaServerModels)
    .where(eq(ollamaServerModels.serverId, serverId));

  return rows.map((row) => row.modelIdentifier);
}

export async function replaceOllamaServerModels(
  serverId: number,
  modelIdentifiers: string[]
): Promise<void> {
  const deduped = dedupeStrings(modelIdentifiers);

  await db
    .delete(ollamaServerModels)
    .where(eq(ollamaServerModels.serverId, serverId))
    .run();

  if (deduped.length === 0) {
    return;
  }

  await db
    .insert(ollamaServerModels)
    .values(
      deduped.map((modelIdentifier) => ({
        serverId,
        modelIdentifier,
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
    .run();
}

export async function getEnabledOllamaServersForModel(
  modelIdentifier: string
): Promise<OllamaServer[]> {
  await ensureDefaultOllamaServer();

  return await db
    .select({
      id: ollamaServers.id,
      name: ollamaServers.name,
      baseUrl: ollamaServers.baseUrl,
      isEnabled: ollamaServers.isEnabled,
      createdAt: ollamaServers.createdAt,
      updatedAt: ollamaServers.updatedAt,
    })
    .from(ollamaServers)
    .innerJoin(
      ollamaServerModels,
      and(
        eq(ollamaServerModels.serverId, ollamaServers.id),
        eq(ollamaServerModels.modelIdentifier, modelIdentifier)
      )
    )
    .where(eq(ollamaServers.isEnabled, true));
}

export async function getOllamaModelCoverageCounts(): Promise<
  Record<string, number>
> {
  await ensureDefaultOllamaServer();

  const rows = await db
    .select({
      modelIdentifier: ollamaServerModels.modelIdentifier,
      coverage: sql<number>`count(distinct ${ollamaServerModels.serverId})`,
    })
    .from(ollamaServerModels)
    .innerJoin(
      ollamaServers,
      and(
        eq(ollamaServerModels.serverId, ollamaServers.id),
        eq(ollamaServers.isEnabled, true)
      )
    )
    .groupBy(ollamaServerModels.modelIdentifier);

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.modelIdentifier] = row.coverage;
  }

  return map;
}

export async function listKnownEnabledOllamaModels(): Promise<string[]> {
  await ensureDefaultOllamaServer();

  const rows = await db
    .selectDistinct({
      modelIdentifier: ollamaServerModels.modelIdentifier,
    })
    .from(ollamaServerModels)
    .innerJoin(
      ollamaServers,
      and(
        eq(ollamaServerModels.serverId, ollamaServers.id),
        eq(ollamaServers.isEnabled, true)
      )
    );

  return rows.map((row) => row.modelIdentifier);
}

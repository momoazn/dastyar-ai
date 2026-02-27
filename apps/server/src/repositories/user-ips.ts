import { countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import { db, userIps } from "@/database";

export async function recordUserIp(params: {
  userId: number;
  ipAddress: string;
}): Promise<void> {
  const now = new Date();

  await db
    .insert(userIps)
    .values({
      userId: params.userId,
      ipAddress: params.ipAddress,
      firstSeenAt: now,
      lastSeenAt: now,
      hitCount: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userIps.userId, userIps.ipAddress],
      set: {
        lastSeenAt: now,
        hitCount: sql`${userIps.hitCount} + 1`,
        updatedAt: now,
      },
    })
    .run();
}

export async function listRecentUserIps(
  userId: number,
  limit = 3
): Promise<string[]> {
  const rows = await db
    .select({ ipAddress: userIps.ipAddress })
    .from(userIps)
    .where(eq(userIps.userId, userId))
    .orderBy(desc(userIps.lastSeenAt))
    .limit(limit);

  return rows.map((row) => row.ipAddress);
}

export async function countDistinctUserIps(userId: number): Promise<number> {
  const rows = await db
    .select({ count: countDistinct(userIps.ipAddress) })
    .from(userIps)
    .where(eq(userIps.userId, userId));

  return rows.at(0)?.count ?? 0;
}

export async function listUsersRecentIps(
  userIds: number[]
): Promise<Record<number, { latestIps: string[]; ipCount: number }>> {
  if (userIds.length === 0) {
    return {};
  }

  const [counts, latest] = await Promise.all([
    db
      .select({
        userId: userIps.userId,
        ipCount: countDistinct(userIps.ipAddress),
      })
      .from(userIps)
      .where(inArray(userIps.userId, userIds))
      .groupBy(userIps.userId),
    Promise.all(
      userIds.map(async (userId) => {
        const ips = await listRecentUserIps(userId, 3);
        return { userId, ips };
      })
    ),
  ]);

  const countByUserId = new Map(
    counts.map((row) => [row.userId, row.ipCount ?? 0] as const)
  );

  return latest.reduce<
    Record<number, { latestIps: string[]; ipCount: number }>
  >((acc, row) => {
    acc[row.userId] = {
      latestIps: row.ips,
      ipCount: countByUserId.get(row.userId) ?? 0,
    };
    return acc;
  }, {});
}

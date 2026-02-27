import { and, count, desc, eq, like } from "drizzle-orm";
import {
  chatThreads,
  codeRuns,
  db,
  documents,
  generatedImages,
  messages,
  summaries,
  translations,
  type User,
  type UserRole,
  users,
} from "@/database";
import { hashPassword } from "./auth";
import { listUsersRecentIps } from "./user-ips";

export type UserWithoutSensitiveData = Omit<User, "password">;

export interface UserWithStats extends UserWithoutSensitiveData {
  messageCount: number;
  documentCount: number;
  imageCount: number;
  translationCount: number;
  summaryCount: number;
  codeRunCount: number;
  threadCount: number;
}

export interface AdminUserListItem extends UserWithoutSensitiveData {
  latestIps: string[];
  ipCount: number;
}

export type UserListResponse = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listUsers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
}): Promise<UserListResponse> {
  const { search, role, page = 1, pageSize = 10 } = options ?? {};

  const conditions: Array<ReturnType<typeof like> | ReturnType<typeof eq>> = [];
  if (search) {
    conditions.push(like(users.username, `%${search}%`));
  }
  if (role) {
    conditions.push(eq(users.role, role));
  }

  const whereClause = (() => {
    if (conditions.length === 0) {
      return;
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return and(...conditions);
  })();

  // Count query
  const countQuery = db.select({ value: count() }).from(users);
  const totalResult = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;
  const total = totalResult.at(0)?.value ?? 0;

  // Data query
  const dataQuery = db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const offset = (page - 1) * pageSize;
  const rows = whereClause
    ? await dataQuery.where(whereClause).limit(pageSize).offset(offset)
    : await dataQuery.limit(pageSize).offset(offset);

  const ipDataByUserId = await listUsersRecentIps(rows.map((row) => row.id));
  const usersWithIps: AdminUserListItem[] = rows.map((row) => ({
    ...row,
    latestIps: ipDataByUserId[row.id]?.latestIps ?? [],
    ipCount: ipDataByUserId[row.id]?.ipCount ?? 0,
  }));

  return {
    users: usersWithIps,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function countByUserId(
  table:
    | typeof messages
    | typeof documents
    | typeof generatedImages
    | typeof translations
    | typeof summaries
    | typeof codeRuns
    | typeof chatThreads,
  userId: number
): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(table)
    .where(eq((table as typeof messages).userId, userId));
  return result.at(0)?.value ?? 0;
}

export async function getUserWithStats(
  userId: number
): Promise<UserWithStats | null> {
  const user = await getUserById(userId);
  if (!user) {
    return null;
  }

  const [
    messageCount,
    documentCount,
    imageCount,
    translationCount,
    summaryCount,
    codeRunCount,
    threadCount,
  ] = await Promise.all([
    countByUserId(messages, userId),
    countByUserId(documents, userId),
    countByUserId(generatedImages, userId),
    countByUserId(translations, userId),
    countByUserId(summaries, userId),
    countByUserId(codeRuns, userId),
    countByUserId(chatThreads, userId),
  ]);

  return {
    ...user,
    messageCount,
    documentCount,
    imageCount,
    translationCount,
    summaryCount,
    codeRunCount,
    threadCount,
  };
}

export async function updateUser(
  userId: number,
  updates: {
    username?: string;
    role?: UserRole;
    password?: string;
  }
): Promise<UserWithoutSensitiveData> {
  const updateData: {
    username?: string;
    role?: UserRole;
    password?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
    ...(updates.username !== undefined && { username: updates.username }),
    ...(updates.role !== undefined && { role: updates.role }),
    ...(updates.password !== undefined && {
      password: await hashPassword(updates.password),
    }),
  };

  await db.update(users).set(updateData).where(eq(users.id, userId)).run();

  const updatedUser = await getUserById(userId);
  if (!updatedUser) {
    throw new Error("User not found after update");
  }
  return updatedUser;
}

export async function getUserById(
  userId: number
): Promise<UserWithoutSensitiveData | null> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows.at(0) ?? null;
}

export async function deleteUser(userId: number): Promise<void> {
  await db.delete(users).where(eq(users.id, userId)).run();
}

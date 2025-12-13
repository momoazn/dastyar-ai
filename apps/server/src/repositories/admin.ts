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

export type UserListResponse = {
  users: UserWithoutSensitiveData[];
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
  const { search, role } = options ?? {};
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;

  const conditions: Array<ReturnType<typeof like> | ReturnType<typeof eq>> = [];
  if (search) {
    conditions.push(like(users.username, `%${search}%`));
  }
  if (role) {
    conditions.push(eq(users.role, role));
  }

  // Count query
  const countBase = db.select({ value: count() }).from(users);
  let totalResult: Array<{ value: number }>;
  if (conditions.length === 0) {
    totalResult = await countBase;
  } else if (conditions.length === 1) {
    totalResult = await countBase.where(conditions[0]);
  } else {
    totalResult = await countBase.where(and(...conditions));
  }
  const total = totalResult[0]?.value ?? 0;

  // Data query
  const dataBase = db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const getDataQuery = () => {
    if (conditions.length === 0) {
      return dataBase;
    }
    if (conditions.length === 1) {
      return dataBase.where(conditions[0]);
    }
    return dataBase.where(and(...conditions));
  };

  // Always apply pagination
  const offset = (page - 1) * pageSize;
  const rows = await getDataQuery().limit(pageSize).offset(offset);

  return {
    users: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUserWithStats(
  userId: number
): Promise<UserWithStats | null> {
  const user = await getUserById(userId);
  if (!user) {
    return null;
  }

  const [
    messageCountResult,
    documentCountResult,
    imageCountResult,
    translationCountResult,
    summaryCountResult,
    codeRunCountResult,
    threadCountResult,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(messages)
      .where(eq(messages.userId, userId)),
    db
      .select({ value: count() })
      .from(documents)
      .where(eq(documents.userId, userId)),
    db
      .select({ value: count() })
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId)),
    db
      .select({ value: count() })
      .from(translations)
      .where(eq(translations.userId, userId)),
    db
      .select({ value: count() })
      .from(summaries)
      .where(eq(summaries.userId, userId)),
    db
      .select({ value: count() })
      .from(codeRuns)
      .where(eq(codeRuns.userId, userId)),
    db
      .select({ value: count() })
      .from(chatThreads)
      .where(eq(chatThreads.userId, userId)),
  ]);

  return {
    ...user,
    messageCount: messageCountResult[0]?.value ?? 0,
    documentCount: documentCountResult[0]?.value ?? 0,
    imageCount: imageCountResult[0]?.value ?? 0,
    translationCount: translationCountResult[0]?.value ?? 0,
    summaryCount: summaryCountResult[0]?.value ?? 0,
    codeRunCount: codeRunCountResult[0]?.value ?? 0,
    threadCount: threadCountResult[0]?.value ?? 0,
  };
}

export async function updateUser(
  userId: number,
  updates: {
    role?: UserRole;
    password?: string;
  }
): Promise<UserWithoutSensitiveData> {
  const updateData: { role?: UserRole; password?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (updates.role !== undefined) {
    updateData.role = updates.role;
  }

  if (updates.password !== undefined) {
    updateData.password = await hashPassword(updates.password);
  }

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

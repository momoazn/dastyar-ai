import PocketBase from "pocketbase";
import {
  MessagesRecord,
  MessagesRoleOptions,
  MessagesStatusOptions,
  ThreadsRecord,
  TranslationsRecord,
  TypedPocketBase,
} from "../src/lib/pocketbase-types";

export class Database {
  private pb: PocketBase;

  constructor() {
    this.pb = new PocketBase("http://localhost:8090") as TypedPocketBase;
  }

  async createThread(title: string): Promise<ThreadsRecord> {
    const record = await this.pb.collection<ThreadsRecord>("threads").create({
      title,
    });
    return record;
  }

  async getThread(id: string): Promise<ThreadsRecord | null> {
    try {
      const record = await this.pb
        .collection<ThreadsRecord>("threads")
        .getOne(id);
      return record;
    } catch (error) {
      return null;
    }
  }

  async updateThread(
    id: string,
    updates: Partial<ThreadsRecord>,
  ): Promise<ThreadsRecord> {
    const record = await this.pb
      .collection<ThreadsRecord>("threads")
      .update(id, updates);
    return record;
  }

  async createMessage({
    threadId,
    content,
    role,
    status = MessagesStatusOptions.idle,
    model,
  }: {
    threadId: string;
    content: string;
    role: MessagesRoleOptions;
    status?: MessagesStatusOptions;
    model: string;
  }): Promise<MessagesRecord> {
    const record = await this.pb.collection<MessagesRecord>("messages").create({
      thread: threadId,
      content,
      role,
      status,
      model,
    });
    return record;
  }

  async updateMessage(
    messageId: string,
    updates: Partial<MessagesRecord>,
  ): Promise<MessagesRecord> {
    const record = await this.pb
      .collection<MessagesRecord>("messages")
      .update(messageId, updates);
    return record;
  }

  async getMessages(threadId: string): Promise<MessagesRecord[]> {
    const records = await this.pb
      .collection<MessagesRecord>("messages")
      .getFullList({
        filter: `thread = "${threadId}"`,
        sort: "created",
      });
    return records;
  }

  async createTranslation(
    newTranslation: Omit<TranslationsRecord, "id" | "created" | "updated">,
  ): Promise<TranslationsRecord> {
    const record = await this.pb
      .collection<TranslationsRecord>("translations")
      .create(newTranslation);
    return record;
  }
}

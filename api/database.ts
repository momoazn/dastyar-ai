import PocketBase from "pocketbase";
import {
  MessagesRecord,
  MessagesRoleOptions,
  MessagesStatusOptions,
  PdfsRecord,
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

  async createPDF(
    threadId: string,
    filename: string,
    filePath: string,
  ): Promise<PdfsRecord> {
    const record = await this.pb.collection<PdfsRecord>("pdfs").create({
      thread: threadId,
      filename,
      file: filePath,
    });
    return record;
  }

  async getPDF(id: string): Promise<PdfsRecord | null> {
    try {
      const record = await this.pb.collection<PdfsRecord>("pdfs").getOne(id);
      return record;
    } catch (error) {
      return null;
    }
  }

  async deletePDF(id: string): Promise<boolean> {
    try {
      await this.pb.collection<PdfsRecord>("pdfs").delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getPDFsByThread(threadId: string): Promise<PdfsRecord[]> {
    const records = await this.pb.collection<PdfsRecord>("pdfs").getFullList({
      filter: `thread = "${threadId}"`,
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

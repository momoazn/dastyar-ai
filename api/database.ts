import PocketBase from "pocketbase";
import {
  MessagesRecord,
  MessagesStatusOptions,
  PdfsRecord,
  ThreadsRecord,
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

  async createMessage(
    threadId: string,
    content: string,
    role: "user" | "assistant",
    status: MessagesStatusOptions = MessagesStatusOptions.idle,
  ): Promise<MessagesRecord> {
    const record = await this.pb.collection<MessagesRecord>("messages").create({
      thread: threadId,
      content,
      role,
      status,
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
      const record = await this.pb
        .collection<PdfsRecord>("pdfs")
        .getOne(id);
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
}

import PocketBase from "pocketbase";
import {
  MessagesRecord,
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
  ): Promise<MessagesRecord> {
    const record = await this.pb.collection<MessagesRecord>("messages").create({
      thread: threadId,
      content,
      role,
    });
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
    messageId: string,
    filename: string,
    filePath: string,
  ): Promise<PdfsRecord> {
    const record = await this.pb.collection<PdfsRecord>("pdfs").create({
      message: messageId,
      filename,
      file_path: filePath,
    });
    return record;
  }

  async getPDFsByThread(threadId: string): Promise<PdfsRecord[]> {
    const records = await this.pb.collection<PdfsRecord>("pdfs").getFullList({
      expand: "message",
      filter: `message.thread = "${threadId}"`,
    });
    return records;
  }
}

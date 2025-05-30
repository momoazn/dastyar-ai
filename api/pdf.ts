import pdf from "pdf-parse";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class PDFProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async processPDF(buffer: Buffer, filename: string): Promise<Document[]> {
    try {
      const data = await pdf(buffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      const chunks = await this.textSplitter.splitText(text);

      return chunks.map(
        (chunk, index) =>
          new Document({
            pageContent: chunk,
            metadata: {
              source: filename,
              chunk: index,
              totalChunks: chunks.length,
            },
          }),
      );
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw new Error(`Failed to process PDF: ${error}`);
    }
  }
}

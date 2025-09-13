import fs from 'node:fs';
import path from 'node:path';
import { config, isProduction } from '@/config';

// Regex constants at module level for performance
const DATA_URL_PREFIX_REGEX = /^data:image\/[a-zA-Z]+;base64,/;

export const ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB;

export interface ImageMetadata {
  id: string;
  prompt: string;
  negativePrompt?: string;
  settings: Record<string, unknown>;
}

export interface SaveImageResult {
  filePath: string;
  fileName: string;
}

export class ImageStorageService {
  private get imagesDir() {
    return config.images_dir;
  }

  private generateFileName(id: string): string {
    const timestamp = Date.now();
    return `${timestamp}-${id}.png`;
  }

  private getDateBasedDir(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return path.join(this.imagesDir, String(year), month);
  }

  saveImage(base64Data: string, metadata: ImageMetadata): SaveImageResult {
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(DATA_URL_PREFIX_REGEX, '');

    // Create date-based directory structure
    const dateDir = this.getDateBasedDir();
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    // Generate file names
    const fileName = this.generateFileName(metadata.id);
    const filePath = path.join(dateDir, fileName);

    // Save the main image
    const imageBuffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(filePath, imageBuffer);

    return {
      filePath,
      fileName,
    };
  }

  deleteImage(filePath: string): void {
    try {
      // Delete main image file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
      throw new Error('Failed to delete image file');
    }
  }

  getImageUrl(id: string): string {
    // In development, the web app runs on a different port than the server,
    // so we must return an absolute URL to avoid broken links.
    if (!isProduction()) {
      const baseUrl = `http://${config.host}:${config.port}`;
      return `${baseUrl}/api/images/${id}/file`;
    }

    // In production, the server hosts the web assets under the same origin
    return `/api/images/${id}/file`;
  }

  validateImageFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const stats = fs.statSync(filePath);

      // Check file size
      if (stats.size > MAX_FILE_SIZE) {
        return false;
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      return ALLOWED_FORMATS.includes(ext);
    } catch {
      return false;
    }
  }

  cleanupOrphanedFiles(existingFilePaths: string[]): number {
    let deletedCount = 0;
    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
          // Remove empty directories
          try {
            fs.rmdirSync(fullPath);
          } catch {
            // Directory not empty, that's fine
          }
        } else if (!existingFilePaths.includes(fullPath)) {
          // Check if this file is referenced in the database
          try {
            fs.unlinkSync(fullPath);
            deletedCount++;
            console.log(`Deleted orphaned file: ${fullPath}`);
          } catch (error) {
            console.error(`Failed to delete orphaned file ${fullPath}:`, error);
          }
        }
      }
    };

    // Clean main images directory
    walkDir(this.imagesDir);

    return deletedCount;
  }

  getFileStats(): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          totalFiles++;
          totalSize += stat.size;
        } else if (stat.isDirectory()) {
          walkDir(fullPath);
        }
      }
    };

    walkDir(this.imagesDir);

    return {
      totalFiles,
      totalSize,
    };
  }
}

// Export singleton instance
export const imageStorageService = new ImageStorageService();

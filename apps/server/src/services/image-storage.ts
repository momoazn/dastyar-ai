import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/config";

// Regex constants at module level for performance
const DATA_URL_PREFIX_REGEX = /^data:image\/[a-zA-Z]+;base64,/;

export const ALLOWED_FORMATS = ["png", "jpg", "jpeg", "webp"];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB;

export type SaveImageResult = {
  filePath: string;
  fileName: string;
};

const getImagesDir = (): string => env.IMAGES_DIR;

const generateFileName = (): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${randomSuffix}.png`;
};

const getDateBasedDir = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return path.join(getImagesDir(), String(year), month);
};

export const saveImage = async (
  base64Data: string
): Promise<SaveImageResult> => {
  const cleanBase64 = base64Data.replace(DATA_URL_PREFIX_REGEX, "");
  const dateDir = getDateBasedDir();

  try {
    await fs.access(dateDir);
  } catch {
    await fs.mkdir(dateDir, { recursive: true });
  }

  const fileName = generateFileName();
  const filePath = path.join(dateDir, fileName);
  const imageBuffer = Buffer.from(cleanBase64, "base64");
  await fs.writeFile(filePath, imageBuffer);
  return { filePath, fileName };
};

export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch {
    throw new Error("Failed to delete image file");
  }
};

export const getImageUrl = (id: number): string => `/api/images/${id}/file`;

export const validateImageFile = async (filePath: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      return false;
    }
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    return ALLOWED_FORMATS.includes(ext);
  } catch {
    return false;
  }
};

export const cleanupOrphanedFiles = async (
  existingFilePaths: string[]
): Promise<number> => {
  let deletedCount = 0;

  const walkDir = async (dir: string): Promise<void> => {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await walkDir(fullPath);
          try {
            await fs.rmdir(fullPath);
          } catch {
            // ignore non-empty directories
          }
        } else if (!existingFilePaths.includes(fullPath)) {
          try {
            await fs.unlink(fullPath);
            deletedCount++;
          } catch {
            // ignore failures during cleanup
          }
        }
      }
    } catch {
      // ignore errors during directory reading
    }
  };

  await walkDir(getImagesDir());
  return deletedCount;
};

export const getFileStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
}> => {
  let totalFiles = 0;
  let totalSize = 0;

  const walkDir = async (dir: string): Promise<void> => {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          totalFiles++;
          totalSize += stat.size;
        } else if (stat.isDirectory()) {
          await walkDir(fullPath);
        }
      }
    } catch {
      // ignore errors during directory reading
    }
  };

  await walkDir(getImagesDir());
  return { totalFiles, totalSize };
};

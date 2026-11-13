import { describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import path from "node:path";
import { env, resolveConfiguredPath } from "@/config";
import { deleteImage, saveImage } from "./image-storage";

describe("image storage", () => {
  it("resolves a relative IMAGES_DIR like the other storage dirs", async () => {
    const original = env.IMAGES_DIR;
    env.IMAGES_DIR = "test-relative-images";
    const expectedDir = resolveConfiguredPath("test-relative-images");
    try {
      const saved = await saveImage(Buffer.from("png").toString("base64"));
      expect(saved.filePath.startsWith(expectedDir)).toBe(true);
    } finally {
      env.IMAGES_DIR = original;
      rmSync(expectedDir, { recursive: true, force: true });
    }
  });

  it("deleteImage blocks path traversal outside IMAGES_DIR", async () => {
    const original = env.IMAGES_DIR;
    env.IMAGES_DIR = "test-relative-images";
    try {
      await expect(deleteImage("/etc/passwd")).rejects.toThrow(
        "Invalid image file path"
      );
    } finally {
      env.IMAGES_DIR = original;
    }
  });

  it("deleteImage does not throw if file does not exist on disk", async () => {
    const original = env.IMAGES_DIR;
    env.IMAGES_DIR = "test-relative-images";
    const expectedDir = resolveConfiguredPath("test-relative-images");
    try {
      const nonExistentPath = path.join(
        expectedDir,
        "2026",
        "11",
        "non-existent.png"
      );
      await expect(deleteImage(nonExistentPath)).resolves.toBeUndefined();
    } finally {
      env.IMAGES_DIR = original;
    }
  });
});

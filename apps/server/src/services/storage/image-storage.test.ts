import { describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import { env, resolveConfiguredPath } from "@/config";
import { saveImage } from "./image-storage";

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
});

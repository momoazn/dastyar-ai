import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { type AuthEnv, authMiddlewareHeaderOrQuery } from "@/middlewares/auth";
import { getGeneratedImageByUser } from "@/repositories/images";

const getContentType = (fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") {
    return "image/png";
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }
  if (ext === ".webp") {
    return "image/webp";
  }
  return "application/octet-stream";
};

const app = new Hono<AuthEnv>()
  .use(authMiddlewareHeaderOrQuery)
  // Serve image file
  .get("/:id/file", async (c) => {
    const { id } = c.req.param();
    const user = c.get("user");

    try {
      const image = await getGeneratedImageByUser(
        Number.parseInt(id, 10),
        user.id
      );
      if (!image) {
        return c.json({ error: "Image not found" }, 404);
      }

      try {
        await fs.promises.access(image.filePath, fs.constants.F_OK);
      } catch {
        return c.json({ error: "Image file not found on disk" }, 404);
      }

      const stat = await fs.promises.stat(image.filePath);
      const fileStream = fs.createReadStream(image.filePath);

      c.header("Content-Type", getContentType(image.fileName));
      c.header("Content-Disposition", `inline; filename="${image.fileName}"`);
      c.header("Content-Length", stat.size.toString());
      c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

      return new Response(fileStream as unknown as ReadableStream, {
        status: 200,
        headers: c.res.headers,
      });
    } catch {
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Download image with proper headers
  .get("/:id/download", async (c) => {
    const { id } = c.req.param();
    const user = c.get("user");

    try {
      const image = await getGeneratedImageByUser(
        Number.parseInt(id, 10),
        user.id
      );
      if (!image) {
        return c.json({ error: "Image not found" }, 404);
      }

      try {
        await fs.promises.access(image.filePath, fs.constants.F_OK);
      } catch {
        return c.json({ error: "Image file not found on disk" }, 404);
      }

      const stat = await fs.promises.stat(image.filePath);
      const fileStream = fs.createReadStream(image.filePath);

      // Set download headers
      c.header("Content-Type", "application/octet-stream");
      c.header(
        "Content-Disposition",
        `attachment; filename="${image.fileName}"`
      );
      c.header("Content-Length", stat.size.toString());

      return new Response(fileStream as unknown as ReadableStream, {
        status: 200,
        headers: c.res.headers,
      });
    } catch {
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default app;

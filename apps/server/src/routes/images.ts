import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { type AuthEnv, authMiddleware } from "@/middlewares";
import { getGeneratedImageByUser } from "@/repositories/images";

const app = new Hono<AuthEnv>()
  .use(authMiddleware)
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

      // Determine content type from file extension
      const ext = path.extname(image.fileName).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".png") {
        contentType = "image/png";
      } else if (ext === ".jpg" || ext === ".jpeg") {
        contentType = "image/jpeg";
      } else if (ext === ".webp") {
        contentType = "image/webp";
      }

      c.header("Content-Type", contentType);
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

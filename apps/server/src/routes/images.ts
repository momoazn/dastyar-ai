import fs from "node:fs";
import path from "node:path";
import type { Context } from "hono";
import { Hono } from "hono";
import { env, resolveConfiguredPath } from "@/config";
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

async function streamImage(
  c: Context<AuthEnv>,
  disposition: "inline" | "attachment"
) {
  const { id: idParam } = c.req.param();
  const parsedId = Number.parseInt(idParam, 10);
  if (Number.isNaN(parsedId)) {
    return c.json({ error: "Invalid image id" }, 400);
  }

  const user = c.get("user");

  try {
    const image = await getGeneratedImageByUser(parsedId, user.id);
    if (!image) {
      return c.json({ error: "Image not found" }, 404);
    }

    const imagesDir = path.resolve(resolveConfiguredPath(env.IMAGES_DIR));
    const resolvedPath = path.resolve(image.filePath);
    if (!resolvedPath.startsWith(imagesDir + path.sep)) {
      return c.json({ error: "Access denied" }, 403);
    }

    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(image.filePath);
    } catch {
      return c.json({ error: "Image file not found on disk" }, 404);
    }

    const headers = new Headers();
    const file = Bun.file(image.filePath);
    headers.set(
      "Content-Type",
      disposition === "inline"
        ? getContentType(image.fileName)
        : "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${image.fileName}"`
    );
    headers.set("Content-Length", stat.size.toString());
    if (disposition === "inline") {
      headers.set("Cache-Control", "private, max-age=31536000");
    }

    return new Response(file.stream(), {
      status: 200,
      headers,
    });
  } catch {
    return c.json({ error: "Internal server error" }, 500);
  }
}

const app = new Hono<AuthEnv>()
  .use(authMiddlewareHeaderOrQuery)
  .get("/:id/file", (c) => streamImage(c, "inline"))
  .get("/:id/download", (c) => streamImage(c, "attachment"));

export default app;

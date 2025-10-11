import fs from 'node:fs';
import { Hono } from 'hono';
import { type AuthEnv, authMiddleware } from '@/middlewares';
import { getGeneratedImageByUser } from '@/repositories/images';

const app = new Hono<AuthEnv>()
  .use(authMiddleware)
  // Serve image file
  .get('/:id/file', async (c) => {
    const { id } = c.req.param();
    const user = c.get('user');

    try {
      const image = await getGeneratedImageByUser(
        Number.parseInt(id, 10),
        user.id
      );
      if (!image) {
        return c.json({ error: 'Image not found' }, 404);
      }

      try {
        await fs.promises.access(image.filePath, fs.constants.F_OK);
      } catch {
        return c.json({ error: 'Image file not found on disk' }, 404);
      }

      const fileBuffer = await fs.promises.readFile(image.filePath);

      // Set appropriate headers
      c.header('Content-Type', 'image/png');
      c.header('Content-Disposition', `inline; filename="${image.fileName}"`);
      c.header('Content-Length', fileBuffer.length.toString());
      c.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Convert Buffer to Uint8Array for Hono compatibility
      return new Response(new Uint8Array(fileBuffer), {
        status: 200,
        headers: c.res.headers,
      });
    } catch (error) {
      console.error('Error serving image file:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })

  // Download image with proper headers
  .get('/:id/download', async (c) => {
    const { id } = c.req.param();
    const user = c.get('user');

    try {
      const image = await getGeneratedImageByUser(
        Number.parseInt(id, 10),
        user.id
      );
      if (!image) {
        return c.json({ error: 'Image not found' }, 404);
      }

      try {
        await fs.promises.access(image.filePath, fs.constants.F_OK);
      } catch {
        return c.json({ error: 'Image file not found on disk' }, 404);
      }

      const fileBuffer = await fs.promises.readFile(image.filePath);

      // Set download headers
      c.header('Content-Type', 'application/octet-stream');
      c.header(
        'Content-Disposition',
        `attachment; filename="${image.fileName}"`
      );
      c.header('Content-Length', fileBuffer.length.toString());

      // Convert Buffer to Uint8Array for Hono compatibility
      return new Response(new Uint8Array(fileBuffer), {
        status: 200,
        headers: c.res.headers,
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

export default app;

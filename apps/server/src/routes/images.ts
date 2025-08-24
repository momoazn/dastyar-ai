import fs from 'node:fs';
import { Hono } from 'hono';
import { getGeneratedImage } from '../repositories/images';

const app = new Hono();

// Serve image file
app.get('/:id/file', async (c) => {
  const { id } = c.req.param();

  try {
    const image = await getGeneratedImage(id);
    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    if (!fs.existsSync(image.filePath)) {
      return c.json({ error: 'Image file not found on disk' }, 404);
    }

    const fileBuffer = fs.readFileSync(image.filePath);

    // Set appropriate headers
    c.header('Content-Type', 'image/png');
    c.header('Content-Disposition', `inline; filename="${image.fileName}"`);
    c.header('Content-Length', fileBuffer.length.toString());
    c.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return c.body(fileBuffer);
  } catch (error) {
    console.error('Error serving image file:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Download image with proper headers
app.get('/:id/download', async (c) => {
  const { id } = c.req.param();

  try {
    const image = await getGeneratedImage(id);
    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    if (!fs.existsSync(image.filePath)) {
      return c.json({ error: 'Image file not found on disk' }, 404);
    }

    const fileBuffer = fs.readFileSync(image.filePath);

    // Set download headers
    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${image.fileName}"`);
    c.header('Content-Length', fileBuffer.length.toString());

    return c.body(fileBuffer);
  } catch (error) {
    console.error('Error downloading image:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;

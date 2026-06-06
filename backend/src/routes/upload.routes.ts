import type { FastifyInstance } from 'fastify';
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { ALLOWED_IMAGE_MIME } from '../config';
import {
  buildFilename,
  ensureUploadDir,
  localPathForFile,
  publicUrlForFile,
} from '../services/upload.service';

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.register(async (scoped) => {
    scoped.addHook('preHandler', app.authenticate);

    // Accepts one or more image files; returns the public URLs.
    scoped.post('/api/admin/upload', async (request, reply) => {
      await ensureUploadDir();
      const urls: string[] = [];

      for await (const part of request.files()) {
        if (!ALLOWED_IMAGE_MIME.has(part.mimetype)) {
          return reply
            .code(415)
            .send({ error: `Unsupported file type: ${part.mimetype}. Allowed: JPG, PNG, WEBP.` });
        }

        const filename = buildFilename(part.mimetype);
        const dest = localPathForFile(filename);

        try {
          await pipeline(part.file, createWriteStream(dest));
        } catch {
          await unlink(dest).catch(() => {});
          return reply.code(413).send({ error: 'File too large. Maximum 5MB per image.' });
        }

        urls.push(publicUrlForFile(filename));
      }

      if (urls.length === 0) {
        return reply.code(400).send({ error: 'No files were uploaded' });
      }

      return { urls };
    });
  });
}

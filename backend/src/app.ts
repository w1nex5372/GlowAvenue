import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config } from './config';
import { registerAuth } from './plugins/auth';
import { ensureUploadDir } from './services/upload.service';
import { publicRoutes } from './routes/public.routes';
import { adminRoutes } from './routes/admin.routes';
import { uploadRoutes } from './routes/upload.routes';

export async function buildApp() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
    bodyLimit: 2 * 1024 * 1024, // 2MB for JSON bodies; uploads use multipart limits.
    trustProxy: true,
  });

  // Uploads directory must exist before @fastify/static is registered.
  await ensureUploadDir();

  await app.register(cors, { origin: true });
  await app.register(multipart, {
    limits: { fileSize: config.maxUploadBytes, files: 10 },
  });
  await app.register(fastifyStatic, {
    root: config.uploadDir,
    prefix: `${config.publicUploadPath}/`,
  });

  await registerAuth(app);

  app.get('/api/health', async () => ({ status: 'ok' }));

  await app.register(publicRoutes);
  await app.register(adminRoutes);
  await app.register(uploadRoutes);

  return app;
}

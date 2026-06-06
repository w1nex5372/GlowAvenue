import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 4000),

  jwtSecret: required('JWT_SECRET', 'dev_insecure_secret_change_me'),

  adminEmail: required('ADMIN_EMAIL', 'admin@glamavenue.co.uk').toLowerCase(),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',

  // Absolute path where uploaded images are stored on disk.
  uploadDir: process.env.UPLOAD_DIR ?? `${process.cwd()}/uploads`,
  // Public URL prefix that maps to uploadDir (served by @fastify/static).
  publicUploadPath: process.env.PUBLIC_UPLOAD_PATH ?? '/uploads',

  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
} as const;

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

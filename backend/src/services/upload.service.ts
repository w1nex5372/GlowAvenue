import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, EXT_BY_MIME } from '../config';

const PRODUCTS_DIR = path.join(config.uploadDir, 'products');

export async function ensureUploadDir(): Promise<void> {
  await mkdir(PRODUCTS_DIR, { recursive: true });
}

export function buildFilename(mimetype: string): string {
  const ext = EXT_BY_MIME[mimetype] ?? 'bin';
  const id = crypto.randomBytes(8).toString('hex');
  return `${Date.now()}-${id}.${ext}`;
}

export function publicUrlForFile(filename: string): string {
  return `${config.publicUploadPath}/products/${filename}`;
}

export function localPathForFile(filename: string): string {
  return path.join(PRODUCTS_DIR, filename);
}

/** Best-effort removal of locally-stored image files for a deleted product. */
export async function deleteLocalImages(images: unknown): Promise<void> {
  if (!Array.isArray(images)) return;
  const prefix = `${config.publicUploadPath}/products/`;

  await Promise.all(
    images.map(async (url) => {
      if (typeof url !== 'string' || !url.startsWith(prefix)) return;
      const filename = url.slice(prefix.length);
      // Guard against path traversal.
      if (!filename || filename.includes('/') || filename.includes('..')) return;
      try {
        await unlink(localPathForFile(filename));
      } catch {
        /* file already gone — ignore */
      }
    }),
  );
}

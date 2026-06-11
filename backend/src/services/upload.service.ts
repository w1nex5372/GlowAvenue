import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, EXT_BY_MIME } from '../config';

const PRODUCTS_DIR = path.resolve(config.uploadDir, 'products');

interface ImageDeleteLogger {
  warn: (details: object, message: string) => void;
}

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

/** Best-effort removal of locally stored image files for a deleted product. */
export async function deleteLocalImages(images: unknown, logger?: ImageDeleteLogger): Promise<void> {
  if (!Array.isArray(images)) return;
  const prefix = `${config.publicUploadPath.replace(/\/+$/, '')}/products/`;

  await Promise.all(
    images.map(async (url) => {
      if (typeof url !== 'string' || !url.startsWith(prefix)) return;

      const target = safeProductImagePath(url.slice(prefix.length));
      if (!target) {
        logger?.warn({ imageUrl: url }, 'Skipped unsafe local product image path during deletion');
        return;
      }

      try {
        await unlink(target);
      } catch (err) {
        logger?.warn({ err, imageUrl: url }, 'Could not delete local product image');
      }
    }),
  );
}

function safeProductImagePath(rawFilename: string): string | null {
  let filename: string;
  try {
    filename = decodeURIComponent(rawFilename);
  } catch {
    return null;
  }

  if (
    !filename ||
    filename.includes('\0') ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename === '.' ||
    filename === '..'
  ) {
    return null;
  }

  const target = path.resolve(PRODUCTS_DIR, filename);
  const relative = path.relative(PRODUCTS_DIR, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.includes(path.sep)) {
    return null;
  }
  return target;
}

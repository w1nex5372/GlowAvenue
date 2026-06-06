import slugify from 'slugify';
import { prisma } from './prisma';

/**
 * Build a URL-safe, unique slug from a product name.
 * If the base slug is taken, append -2, -3, ... until free.
 * `excludeId` lets a product keep its own slug while editing.
 */
export async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true, trim: true }) || 'product';
  let slug = base;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${suffix++}`;
  }
}

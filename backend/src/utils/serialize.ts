import type { Product } from '@prisma/client';

/**
 * Convert a Prisma Product into a JSON-safe shape:
 *  - Decimal price -> number
 *  - images Json   -> string[]
 */
export function serializeProduct(product: Product) {
  return {
    ...product,
    price: Number(product.price),
    images: Array.isArray(product.images) ? (product.images as string[]) : [],
  };
}

/**
 * Public-facing product: strips admin-only fields (e.g. riskLevel).
 * Risk level must NEVER be exposed on the public website.
 */
export function serializePublicProduct(product: Product) {
  const { riskLevel, visible, ...rest } = serializeProduct(product);
  return rest;
}

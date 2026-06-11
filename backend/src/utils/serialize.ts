import type { Product } from '@prisma/client';
import {
  getImageReadiness,
  getPublishErrors,
  getStockStatus,
  PREMIUM_IMAGE_COUNT,
  PUBLISH_MIN_IMAGES,
} from '../services/product.service';

/**
 * Convert a Prisma Product into a JSON-safe shape:
 *  - Decimal price -> number
 *  - images Json   -> string[]
 */
export function serializeProduct(product: Product) {
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const features = Array.isArray(product.features) ? (product.features as string[]) : [];
  const fullDescription = product.fullDescription || product.description;
  const marketplaceComplete = Boolean(
    product.ebayUrl && product.tiktokUrl && product.facebookUrl && product.instagramUrl,
  );
  return {
    ...product,
    sku: product.sku.startsWith('DRAFT-') ? '' : product.sku,
    price: Number(product.price),
    description: fullDescription,
    fullDescription,
    features,
    images,
    stockStatus: getStockStatus(product.quantity),
    imageReadiness: getImageReadiness(images),
    imagesComplete: images.length >= PUBLISH_MIN_IMAGES,
    imagesPremium: images.length >= PREMIUM_IMAGE_COUNT,
    marketplaceComplete,
    websiteReady: getPublishErrors({ ...product, fullDescription, images }).length === 0,
  };
}

/**
 * Public-facing product: strips admin-only fields (e.g. riskLevel).
 * Risk level must NEVER be exposed on the public website.
 */
export function serializePublicProduct(product: Product) {
  const {
    riskLevel,
    visible,
    internalNotes,
    websiteReady,
    imageReadiness,
    imagesComplete,
    imagesPremium,
    marketplaceComplete,
    ...rest
  } = serializeProduct(product);
  return rest;
}

import { Prisma, type Product } from '@prisma/client';
import crypto from 'node:crypto';

export const RISK_LEVELS = ['safe', 'risky', 'bundle'] as const;
export const PRODUCT_STATUSES = ['draft', 'published', 'out_of_stock', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const DEFAULT_MATERIAL = '18k Gold Plated Stainless Steel';
export const DEFAULT_CARE_GUIDE =
  'Avoid water, perfumes and harsh chemicals. Store in a dry place and clean gently with a soft cloth.';
export const DEFAULT_SHIPPING_INFO =
  'Worldwide shipping available. Carefully packaged and dispatched as soon as possible.';
export const DRAFT_MIN_IMAGES = 1;
export const PUBLISH_MIN_IMAGES = 2;
export const PREMIUM_IMAGE_COUNT = 4;
export type ImageReadiness = 'Missing' | 'Partial' | 'Ready' | 'Premium';

const SKU_PREFIXES: Record<string, string> = {
  bracelets: 'BR',
  necklaces: 'NE',
  earrings: 'EA',
  rings: 'RI',
};

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalStr(value: unknown): string | null {
  const valueString = str(value);
  return valueString || null;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function risk(value: unknown): string {
  return typeof value === 'string' && (RISK_LEVELS as readonly string[]).includes(value)
    ? value
    : 'safe';
}

function status(value: unknown, fallback: ProductStatus = 'draft'): ProductStatus {
  return typeof value === 'string' && (PRODUCT_STATUSES as readonly string[]).includes(value)
    ? (value as ProductStatus)
    : fallback;
}

function isValidStatus(value: unknown): value is ProductStatus {
  return typeof value === 'string' && (PRODUCT_STATUSES as readonly string[]).includes(value);
}

function resolvedStatus(
  body: Record<string, unknown>,
  fallback: ProductStatus = 'draft',
): ProductStatus {
  if ('status' in body) return status(body.status, fallback);
  if ('visible' in body) return bool(body.visible, false) ? 'published' : 'draft';
  return fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => str(item)).filter(Boolean)
    : typeof value === 'string'
      ? value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
      : [];
}

function cleanUrl(value: unknown): string | null {
  return optionalStr(value);
}

export function getStockStatus(quantity: number): 'Out of stock' | 'Low stock' | 'In stock' {
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= 2) return 'Low stock';
  return 'In stock';
}

export function getImageReadiness(images: unknown): ImageReadiness {
  const count = stringArray(images).length;
  if (count === 0) return 'Missing';
  if (count < PUBLISH_MIN_IMAGES) return 'Partial';
  if (count >= PREMIUM_IMAGE_COUNT) return 'Premium';
  return 'Ready';
}

export function getPublishErrors(product: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!str(product.name)) errors.push('name');
  if (!str(product.sku) || str(product.sku).startsWith('DRAFT-')) errors.push('sku');
  if (!str(product.category)) errors.push('category');
  if (num(product.price, -1) < 0) errors.push('price');
  if (num(product.quantity, -1) < 0) errors.push('quantity');
  if (!str(product.material)) errors.push('material');
  if (!str(product.shortDescription)) errors.push('short description');
  if (!str(product.fullDescription) && !str(product.description)) errors.push('full description');
  if (stringArray(product.images).length < PUBLISH_MIN_IMAGES) errors.push('at least 2 images');
  return errors;
}

export function validateProductCreate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if ('status' in body && !isValidStatus(body.status)) errors.push('Invalid product status');
  if ('price' in body && num(body.price, -1) < 0) errors.push('Price must be zero or more');
  if ('quantity' in body && num(body.quantity, -1) < 0) errors.push('Quantity must be zero or more');
  const targetStatus = resolvedStatus(body);
  if (targetStatus === 'draft' && stringArray(body.images).length < DRAFT_MIN_IMAGES) {
    errors.push('Draft products require at least 1 image');
  }
  if (targetStatus === 'published') {
    errors.push(...getPublishErrors(body).map((field) => `Required before publishing: ${field}`));
  }
  return errors;
}

export function validateProductUpdate(existing: Product, body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if ('status' in body && !isValidStatus(body.status)) errors.push('Invalid product status');
  if ('price' in body && num(body.price, -1) < 0) errors.push('Price must be zero or more');
  if ('quantity' in body && num(body.quantity, -1) < 0) errors.push('Quantity must be zero or more');

  const merged = { ...existing, ...body };
  const targetStatus = resolvedStatus(body, status(existing.status));
  if (targetStatus === 'draft' && stringArray(merged.images).length < DRAFT_MIN_IMAGES) {
    errors.push('Draft products require at least 1 image');
  }
  if (targetStatus !== 'published') return errors;

  const publishErrors = getPublishErrors(merged);
  const existingPublishErrors = new Set(
    getPublishErrors(existing as unknown as Record<string, unknown>),
  );

  // Legacy published products may retain fields that were already missing,
  // but edits cannot make a previously valid required field invalid.
  if (existing.status === 'published' && existingPublishErrors.size > 0) {
    errors.push(
      ...publishErrors
        .filter((field) => !existingPublishErrors.has(field))
        .map((field) => `Required before publishing: ${field}`),
    );
    const existingImageCount = stringArray(existing.images).length;
    const mergedImageCount = stringArray(merged.images).length;
    if (existingImageCount < PUBLISH_MIN_IMAGES && mergedImageCount < existingImageCount) {
      errors.push('Published legacy products cannot reduce their existing image count');
    }
    return errors;
  }

  errors.push(...publishErrors.map((field) => `Required before publishing: ${field}`));
  return errors;
}

export function buildProductData(body: Record<string, unknown>, slug: string): Prisma.ProductUncheckedCreateInput {
  const productStatus = resolvedStatus(body);
  const fullDescription = str(body.fullDescription) || str(body.description);
  return {
    sku: str(body.sku) || `DRAFT-${crypto.randomUUID()}`,
    name: str(body.name),
    slug,
    category: str(body.category),
    price: new Prisma.Decimal(num(body.price)),
    quantity: Math.trunc(num(body.quantity)),
    material: str(body.material) || DEFAULT_MATERIAL,
    description: fullDescription,
    shortDescription: optionalStr(body.shortDescription),
    fullDescription: optionalStr(fullDescription),
    features: stringArray(body.features),
    careGuide: optionalStr(body.careGuide) ?? DEFAULT_CARE_GUIDE,
    shippingInfo: optionalStr(body.shippingInfo) ?? DEFAULT_SHIPPING_INFO,
    dimensions: optionalStr(body.dimensions),
    weight: optionalStr(body.weight),
    internalNotes: optionalStr(body.internalNotes),
    status: productStatus,
    images: stringArray(body.images),
    ebayUrl: cleanUrl(body.ebayUrl),
    tiktokUrl: cleanUrl(body.tiktokUrl),
    facebookUrl: cleanUrl(body.facebookUrl),
    instagramUrl: cleanUrl(body.instagramUrl),
    riskLevel: risk(body.riskLevel),
    visible: productStatus === 'published' || productStatus === 'out_of_stock',
    featured: bool(body.featured, false),
  };
}

export function buildProductUpdate(body: Record<string, unknown>): Prisma.ProductUncheckedUpdateInput {
  const data: Prisma.ProductUncheckedUpdateInput = {};
  if ('sku' in body && str(body.sku)) data.sku = str(body.sku);
  if ('name' in body) data.name = str(body.name);
  if ('category' in body) data.category = str(body.category);
  if ('price' in body) data.price = new Prisma.Decimal(num(body.price));
  if ('quantity' in body) data.quantity = Math.trunc(num(body.quantity));
  if ('material' in body) data.material = str(body.material);
  if ('shortDescription' in body) data.shortDescription = optionalStr(body.shortDescription);
  if ('fullDescription' in body || 'description' in body) {
    const fullDescription = str(body.fullDescription) || str(body.description);
    data.fullDescription = optionalStr(fullDescription);
    data.description = fullDescription;
  }
  if ('features' in body) data.features = stringArray(body.features);
  if ('careGuide' in body) data.careGuide = optionalStr(body.careGuide);
  if ('shippingInfo' in body) data.shippingInfo = optionalStr(body.shippingInfo);
  if ('dimensions' in body) data.dimensions = optionalStr(body.dimensions);
  if ('weight' in body) data.weight = optionalStr(body.weight);
  if ('internalNotes' in body) data.internalNotes = optionalStr(body.internalNotes);
  if ('status' in body) {
    const productStatus = status(body.status);
    data.status = productStatus;
    data.visible = productStatus === 'published' || productStatus === 'out_of_stock';
  } else if ('visible' in body) {
    const productStatus = bool(body.visible, false) ? 'published' : 'draft';
    data.status = productStatus;
    data.visible = productStatus === 'published';
  }
  if ('images' in body) data.images = stringArray(body.images);
  if ('ebayUrl' in body) data.ebayUrl = cleanUrl(body.ebayUrl);
  if ('tiktokUrl' in body) data.tiktokUrl = cleanUrl(body.tiktokUrl);
  if ('facebookUrl' in body) data.facebookUrl = cleanUrl(body.facebookUrl);
  if ('instagramUrl' in body) data.instagramUrl = cleanUrl(body.instagramUrl);
  if ('riskLevel' in body) data.riskLevel = risk(body.riskLevel);
  if ('featured' in body) data.featured = bool(body.featured, false);
  return data;
}

export function getSkuPrefix(category: string): string | null {
  return SKU_PREFIXES[category.trim().toLowerCase()] ?? null;
}

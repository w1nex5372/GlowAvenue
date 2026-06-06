import { Prisma } from '@prisma/client';

export const RISK_LEVELS = ['safe', 'risky', 'bundle'] as const;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

function images(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function cleanUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/** Validation for creating a product. Returns a list of human-readable errors. */
export function validateProductCreate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!str(body.name)) errors.push('Name is required');
  if (!str(body.sku)) errors.push('SKU is required');
  if (!str(body.category)) errors.push('Category is required');
  if (!str(body.material)) errors.push('Material is required');
  if (num(body.price, -1) < 0) errors.push('Price must be a positive number');
  if (num(body.quantity, -1) < 0) errors.push('Quantity must be zero or more');
  return errors;
}

/** Full data object for a Product.create call. */
export function buildProductData(body: Record<string, unknown>, slug: string): Prisma.ProductUncheckedCreateInput {
  return {
    sku: str(body.sku),
    name: str(body.name),
    slug,
    category: str(body.category),
    price: new Prisma.Decimal(num(body.price)),
    quantity: Math.trunc(num(body.quantity)),
    material: str(body.material),
    description: str(body.description),
    images: images(body.images),
    ebayUrl: cleanUrl(body.ebayUrl),
    tiktokUrl: cleanUrl(body.tiktokUrl),
    facebookUrl: cleanUrl(body.facebookUrl),
    instagramUrl: cleanUrl(body.instagramUrl),
    riskLevel: risk(body.riskLevel),
    visible: bool(body.visible, true),
    featured: bool(body.featured, false),
  };
}

/** Partial data object for a Product.update call — only sets provided keys. */
export function buildProductUpdate(body: Record<string, unknown>): Prisma.ProductUncheckedUpdateInput {
  const data: Prisma.ProductUncheckedUpdateInput = {};
  if ('sku' in body) data.sku = str(body.sku);
  if ('name' in body) data.name = str(body.name);
  if ('category' in body) data.category = str(body.category);
  if ('price' in body) data.price = new Prisma.Decimal(num(body.price));
  if ('quantity' in body) data.quantity = Math.trunc(num(body.quantity));
  if ('material' in body) data.material = str(body.material);
  if ('description' in body) data.description = str(body.description);
  if ('images' in body) data.images = images(body.images);
  if ('ebayUrl' in body) data.ebayUrl = cleanUrl(body.ebayUrl);
  if ('tiktokUrl' in body) data.tiktokUrl = cleanUrl(body.tiktokUrl);
  if ('facebookUrl' in body) data.facebookUrl = cleanUrl(body.facebookUrl);
  if ('instagramUrl' in body) data.instagramUrl = cleanUrl(body.instagramUrl);
  if ('riskLevel' in body) data.riskLevel = risk(body.riskLevel);
  if ('visible' in body) data.visible = bool(body.visible, true);
  if ('featured' in body) data.featured = bool(body.featured, false);
  return data;
}

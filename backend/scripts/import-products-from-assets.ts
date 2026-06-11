/**
 * Safely import products from an external GlowAvenue product asset repository.
 *
 * Usage:
 *   npm run import:products -- "C:\path\to\GlowAvenue_Product_Assets"
 *
 * The source folder stays outside this git repository. Every product is
 * represented by a product.json file. Images are read from the same product
 * folder, copied to uploads/products, and stored in cover-first order.
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { Prisma, PrismaClient, type Product } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MARKETPLACE_FIELDS = ['ebayUrl', 'tiktokUrl', 'facebookUrl', 'instagramUrl'] as const;

type RawProduct = Record<string, unknown>;
type MarketplaceField = (typeof MARKETPLACE_FIELDS)[number];

interface PreparedProduct {
  productJsonPath: string;
  productFolder: string;
  sku: string;
  raw: RawProduct;
  imageSources: string[];
}

interface ImportResult {
  sku: string;
  productJsonPath: string;
  action: 'created' | 'updated' | 'failed';
  imagesCopied: number;
  error?: string;
}

interface ImportReport {
  startedAt: string;
  completedAt?: string;
  sourceFolder: string;
  uploadFolder: string;
  fatalError?: string;
  totals: {
    input: number;
    created: number;
    updated: number;
    failed: number;
    imagesCopied: number;
  };
  results: ImportResult[];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown): string | null {
  return text(value) || null;
}

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function integer(value: unknown): number {
  return Math.trunc(numeric(value));
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function valueFor(raw: RawProduct, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in raw) return raw[key];
  }
  return undefined;
}

function marketplaceValue(raw: RawProduct, field: MarketplaceField): string {
  const aliases: Record<MarketplaceField, string[]> = {
    ebayUrl: ['ebayUrl', 'ebay_url', 'eBay URL'],
    tiktokUrl: ['tiktokUrl', 'tiktok_url', 'TikTok URL'],
    facebookUrl: ['facebookUrl', 'facebook_url', 'facebookMarketplaceUrl', 'Facebook URL'],
    instagramUrl: ['instagramUrl', 'instagram_url', 'Instagram URL'],
  };
  return text(valueFor(raw, ...aliases[field]));
}

function extractImageEntries(raw: RawProduct): string[] {
  const value = valueFor(raw, 'images', 'imagePaths', 'image_paths');
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return text(valueFor(item as RawProduct, 'path', 'file', 'filename', 'name', 'src'));
      }
      return '';
    })
    .filter(Boolean);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findProductJsonFiles(folder: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findProductJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name.toLowerCase() === 'product.json') {
      results.push(entryPath);
    }
  }
  return results.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function findImageFiles(folder: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (await exists(path.join(entryPath, 'product.json'))) continue;
      results.push(...await findImageFiles(entryPath));
    } else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(entryPath);
    }
  }
  return results;
}

function naturalImageOrder(productFolder: string, images: string[]): string[] {
  return images.sort((a, b) =>
    path.relative(productFolder, a).localeCompare(path.relative(productFolder, b), undefined, {
      numeric: true,
    }),
  );
}

function isUploadProductUrl(entry: string): boolean {
  return entry.replace(/\\/g, '/').startsWith('/uploads/products/');
}

async function loadProductJson(productJsonPath: string): Promise<RawProduct> {
  const parsed = JSON.parse(await readFile(productJsonPath, 'utf8')) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${productJsonPath}: product.json must contain one product object.`);
  }
  return parsed as RawProduct;
}

export async function findImages(
  sourceFolder: string,
  productFolder: string,
  raw: RawProduct,
): Promise<string[]> {
  const explicitEntries = extractImageEntries(raw);
  if (explicitEntries.length) {
    const localImages = naturalImageOrder(productFolder, await findImageFiles(productFolder));
    const images: string[] = [];
    for (const entry of explicitEntries) {
      if (isUploadProductUrl(entry)) {
        const normalizedEntry = entry.replace(/\\/g, '/');
        const basename = normalizedEntry.slice('/uploads/products/'.length);
        if (!basename || basename.includes('/') || basename === '.' || basename === '..') {
          throw new Error(`Invalid upload image URL: ${entry}`);
        }
        if (!IMAGE_EXTENSIONS.has(path.extname(basename).toLowerCase())) {
          throw new Error(`Unsupported image type: ${entry}`);
        }
        const matches = localImages.filter((image) => path.basename(image) === basename);
        if (matches.length === 0) return localImages;
        if (matches.length > 1) {
          throw new Error(`Multiple local images match upload URL basename "${basename}".`);
        }
        images.push(matches[0]);
        continue;
      }

      const sourcePath = path.resolve(productFolder, entry.replace(/[\\/]+/g, path.sep));
      const relative = path.relative(sourceFolder, sourcePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Image path escapes source folder: ${entry}`);
      }
      if (!IMAGE_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())) {
        throw new Error(`Unsupported image type: ${entry}`);
      }
      if (!(await exists(sourcePath))) throw new Error(`Image not found: ${entry}`);
      images.push(sourcePath);
    }
    return images;
  }

  return naturalImageOrder(productFolder, await findImageFiles(productFolder));
}

async function prepareProducts(sourceFolder: string): Promise<PreparedProduct[]> {
  const productJsonFiles = await findProductJsonFiles(sourceFolder);
  if (!productJsonFiles.length) throw new Error(`No product.json files found under: ${sourceFolder}`);

  const products: PreparedProduct[] = [];
  const seenSkus = new Set<string>();
  const errors: string[] = [];

  for (const productJsonPath of productJsonFiles) {
    try {
      const raw = await loadProductJson(productJsonPath);
      const sku = text(valueFor(raw, 'sku', 'SKU')).toUpperCase();
      if (!sku) throw new Error('SKU is required.');
      if (seenSkus.has(sku)) throw new Error(`Duplicate SKU "${sku}" in source folder.`);
      if (numeric(valueFor(raw, 'price', 'Price')) < 0) throw new Error('Price cannot be negative.');
      if (numeric(valueFor(raw, 'quantity', 'Quantity')) < 0) throw new Error('Quantity cannot be negative.');
      seenSkus.add(sku);
      const productFolder = path.dirname(productJsonPath);
      const imageSources = await findImages(sourceFolder, productFolder, raw);
      products.push({ productJsonPath, productFolder, sku, raw, imageSources });
    } catch (error) {
      errors.push(`${productJsonPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    throw new Error(`Import validation failed before database changes:\n- ${errors.join('\n- ')}`);
  }
  return products;
}

async function uniqueSlug(name: string, existing?: Product | null): Promise<string> {
  const base = slugify(name, { lower: true, strict: true, trim: true }) || slugify(existing?.sku ?? 'product');
  let candidate = base;
  let suffix = 2;
  while (true) {
    const conflict = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!conflict || conflict.id === existing?.id) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

async function copyOrderedImages(
  sku: string,
  sources: string[],
  uploadFolder: string,
): Promise<{ urls: string[]; createdUrls: string[] }> {
  const urls: string[] = [];
  const createdUrls: string[] = [];
  for (const [index, source] of sources.entries()) {
    const sourceExt = path.extname(source).toLowerCase();
    const ext = sourceExt === '.jpeg' ? '.jpg' : sourceExt;
    const safeSku = sku.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'product';
    const hash = crypto.createHash('sha256').update(await readFile(source)).digest('hex').slice(0, 12);
    const filename = `${safeSku}-${String(index + 1).padStart(2, '0')}-${hash}${ext}`;
    const destination = path.join(uploadFolder, filename);
    const url = `/uploads/products/${filename}`;
    if (!(await exists(destination))) {
      await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
      createdUrls.push(url);
    }
    urls.push(url);
  }
  return { urls, createdUrls };
}

function createData(raw: RawProduct, sku: string, slug: string, images: string[]): Prisma.ProductUncheckedCreateInput {
  const fullDescription = text(valueFor(raw, 'fullDescription', 'full_description', 'description'));
  return {
    sku,
    name: text(valueFor(raw, 'name', 'Name')),
    slug,
    category: text(valueFor(raw, 'category', 'Category')),
    price: new Prisma.Decimal(numeric(valueFor(raw, 'price', 'Price'))),
    quantity: integer(valueFor(raw, 'quantity', 'Quantity')),
    material: text(valueFor(raw, 'material', 'Material')) || '18k Gold Plated Stainless Steel',
    description: fullDescription,
    shortDescription: optionalText(valueFor(raw, 'shortDescription', 'short_description')),
    fullDescription: optionalText(fullDescription),
    features: stringList(valueFor(raw, 'features', 'Features')),
    careGuide: optionalText(valueFor(raw, 'careGuide', 'care_guide')),
    shippingInfo: optionalText(valueFor(raw, 'shippingInfo', 'shipping_info')),
    dimensions: optionalText(valueFor(raw, 'dimensions', 'Dimensions')),
    weight: optionalText(valueFor(raw, 'weight', 'Weight')),
    internalNotes: optionalText(valueFor(raw, 'internalNotes', 'internal_notes')),
    status: 'draft',
    visible: false,
    featured: false,
    heroFeatured: false,
    bestSeller: false,
    newArrival: false,
    trending: false,
    images,
    ebayUrl: marketplaceValue(raw, 'ebayUrl') || null,
    tiktokUrl: marketplaceValue(raw, 'tiktokUrl') || null,
    facebookUrl: marketplaceValue(raw, 'facebookUrl') || null,
    instagramUrl: marketplaceValue(raw, 'instagramUrl') || null,
  };
}

function updateData(
  raw: RawProduct,
  existing: Product,
  slug: string,
  importedImages: string[],
): Prisma.ProductUncheckedUpdateInput {
  const data: Prisma.ProductUncheckedUpdateInput = {};
  const name = text(valueFor(raw, 'name', 'Name'));
  const fullDescription = text(valueFor(raw, 'fullDescription', 'full_description', 'description'));

  if (name) {
    data.name = name;
    data.slug = slug;
  }
  const category = text(valueFor(raw, 'category', 'Category'));
  if (category) data.category = category;
  const material = text(valueFor(raw, 'material', 'Material'));
  if (material) data.material = material;
  if (fullDescription) {
    data.description = fullDescription;
    data.fullDescription = fullDescription;
  }
  const shortDescription = text(valueFor(raw, 'shortDescription', 'short_description'));
  if (shortDescription) data.shortDescription = shortDescription;
  if ('features' in raw || 'Features' in raw) data.features = stringList(valueFor(raw, 'features', 'Features'));

  for (const [target, aliases] of [
    ['careGuide', ['careGuide', 'care_guide']],
    ['shippingInfo', ['shippingInfo', 'shipping_info']],
    ['dimensions', ['dimensions', 'Dimensions']],
    ['weight', ['weight', 'Weight']],
    ['internalNotes', ['internalNotes', 'internal_notes']],
  ] as const) {
    const imported = text(valueFor(raw, ...aliases));
    if (imported) data[target] = imported;
  }

  const importedPrice = numeric(valueFor(raw, 'price', 'Price'));
  if (importedPrice !== 0) data.price = new Prisma.Decimal(importedPrice);
  const importedQuantity = integer(valueFor(raw, 'quantity', 'Quantity'));
  if (importedQuantity !== 0) data.quantity = importedQuantity;
  if (importedImages.length) data.images = importedImages;

  for (const field of MARKETPLACE_FIELDS) {
    const imported = marketplaceValue(raw, field);
    if (imported) data[field] = imported;
  }

  // Existing products retain their current publication state. New products
  // are created as drafts, so an import never publishes products.
  data.status = existing.status;
  data.visible = existing.visible;
  return data;
}

async function cleanupCopiedImages(uploadRoot: string, urls: string[]): Promise<void> {
  await Promise.all(
    urls.map((url) => rm(path.join(uploadRoot, url.replace(/^\/uploads\//, '')), { force: true })),
  );
}

async function main(): Promise<void> {
  const sourceArgument = process.argv[2];
  if (!sourceArgument) {
    throw new Error('Provide the external asset folder path:\n  npm run import:products -- "PATH_TO_ASSET_FOLDER"');
  }

  const sourceFolder = path.resolve(sourceArgument);
  if (!(await exists(sourceFolder))) throw new Error(`Asset folder does not exist: ${sourceFolder}`);

  // Uses the backend's normal runtime upload location. No PostgreSQL volume or
  // migration files are accessed by this importer.
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
  const uploadFolder = path.join(uploadRoot, 'products');
  const reportPath = path.join(
    sourceFolder,
    `products_import_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );

  const report: ImportReport = {
    startedAt: new Date().toISOString(),
    sourceFolder,
    uploadFolder,
    totals: { input: 0, created: 0, updated: 0, failed: 0, imagesCopied: 0 },
    results: [],
  };

  let prepared: PreparedProduct[];
  try {
    prepared = await prepareProducts(sourceFolder);
    report.totals.input = prepared.length;
  } catch (error) {
    report.fatalError = error instanceof Error ? error.message : String(error);
    report.completedAt = new Date().toISOString();
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    throw new Error(`${report.fatalError}\nImport report: ${reportPath}`);
  }

  await mkdir(uploadFolder, { recursive: true });

  for (const product of prepared) {
    let importedImageUrls: string[] = [];
    let newlyCopiedUrls: string[] = [];
    try {
      const existing = await prisma.product.findUnique({ where: { sku: product.sku } });
      const importedName = text(valueFor(product.raw, 'name', 'Name'));
      if (!existing && !importedName) throw new Error('New product requires a name.');

      const copied = await copyOrderedImages(product.sku, product.imageSources, uploadFolder);
      importedImageUrls = copied.urls;
      newlyCopiedUrls = copied.createdUrls;
      const slug = await uniqueSlug(importedName || existing?.name || product.sku, existing);
      const create = createData(product.raw, product.sku, slug, importedImageUrls);
      const update = existing
        ? updateData(product.raw, existing, slug, importedImageUrls)
        : {};

      const imported = await prisma.product.upsert({
        where: { sku: product.sku },
        create,
        update,
      });

      const action = existing ? 'updated' : 'created';
      report.totals[action]++;
      report.totals.imagesCopied += newlyCopiedUrls.length;
      report.results.push({
        sku: imported.sku,
        productJsonPath: product.productJsonPath,
        action,
        imagesCopied: newlyCopiedUrls.length,
      });
    } catch (error) {
      await cleanupCopiedImages(uploadRoot, newlyCopiedUrls);
      report.totals.failed++;
      report.results.push({
        sku: product.sku,
        productJsonPath: product.productJsonPath,
        action: 'failed',
        imagesCopied: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  report.completedAt = new Date().toISOString();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ reportPath, totals: report.totals }, null, 2));
  if (report.totals.failed > 0) process.exitCode = 1;
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

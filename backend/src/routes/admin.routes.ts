import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { serializeProduct } from '../utils/serialize';
import { generateUniqueSlug } from '../utils/slug';
import { getMergedSettings, updateSettings } from '../services/settings.service';
import { deleteLocalImages } from '../services/upload.service';
import {
  buildProductData,
  buildProductUpdate,
  getSkuPrefix,
  validateProductCreate,
  validateProductUpdate,
} from '../services/product.service';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // --- Login (public) ---
  app.post('/api/admin/login', async (request, reply) => {
    const { email, password } = (request.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const emailOk = email.trim().toLowerCase() === config.adminEmail;
    const passOk = config.adminPasswordHash
      ? await bcrypt.compare(password, config.adminPasswordHash)
      : false;

    if (!emailOk || !passOk) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const token = await reply.jwtSign({ sub: config.adminEmail, role: 'admin' }, { expiresIn: '7d' });
    return { token };
  });

  // --- Protected admin routes ---
  app.register(async (admin) => {
    admin.addHook('preHandler', app.authenticate);

    admin.get('/api/admin/products', async () => {
      const products = await prisma.product.findMany({ orderBy: { updatedAt: 'desc' } });
      return products.map(serializeProduct);
    });

    admin.get('/api/admin/products/export.csv', async (_request, reply) => {
      const products = await prisma.product.findMany({ orderBy: { updatedAt: 'desc' } });
      const rows = products.map(serializeProduct);
      const columns: Array<[string, (product: ReturnType<typeof serializeProduct>) => unknown]> = [
        ['SKU', (p) => p.sku],
        ['Name', (p) => p.name],
        ['Category', (p) => p.category],
        ['Price', (p) => p.price],
        ['Quantity', (p) => p.quantity],
        ['Stock Status', (p) => p.stockStatus],
        ['Status', (p) => p.status],
        ['Material', (p) => p.material],
        ['Short Description', (p) => p.shortDescription],
        ['Full Description', (p) => p.fullDescription],
        ['Features', (p) => p.features.join(' | ')],
        ['Care Guide', (p) => p.careGuide],
        ['Shipping Info', (p) => p.shippingInfo],
        ['Dimensions', (p) => p.dimensions],
        ['Weight', (p) => p.weight],
        ['Website URL/slug', (p) => `/product/${p.slug}`],
        ['eBay URL', (p) => p.ebayUrl],
        ['TikTok URL', (p) => p.tiktokUrl],
        ['Facebook URL', (p) => p.facebookUrl],
        ['Instagram URL', (p) => p.instagramUrl],
        ['Internal Notes', (p) => p.internalNotes],
      ];
      const csv = [
        columns.map(([heading]) => csvCell(heading)).join(','),
        ...rows.map((product) => columns.map(([, value]) => csvCell(value(product))).join(',')),
      ].join('\r\n');
      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="glamavenue-products.csv"')
        .send(`\uFEFF${csv}`);
    });

    admin.get('/api/admin/products/sku-suggestion', async (request, reply) => {
      const { category = '' } = request.query as { category?: string };
      const prefix = getSkuPrefix(category);
      if (!prefix) {
        return reply.code(400).send({ error: 'Auto SKU is available for Bracelets, Necklaces, Earrings and Rings' });
      }
      const products = await prisma.product.findMany({
        where: { sku: { startsWith: `GA-${prefix}-` } },
        select: { sku: true },
      });
      const highest = products.reduce((max, product) => {
        const match = product.sku.match(new RegExp(`^GA-${prefix}-(\\d+)$`, 'i'));
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      return { sku: `GA-${prefix}-${String(highest + 1).padStart(4, '0')}` };
    });

    admin.get('/api/admin/products/:id/duplicate', async (request, reply) => {
      const { id } = request.params as { id: string };
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return reply.code(404).send({ error: 'Product not found' });
      return {
        name: '',
        sku: '',
        category: product.category,
        price: Number(product.price),
        quantity: 0,
        material: product.material,
        shortDescription: '',
        fullDescription: '',
        features: [],
        careGuide: product.careGuide ?? '',
        shippingInfo: product.shippingInfo ?? '',
        dimensions: product.dimensions ?? '',
        weight: product.weight ?? '',
        internalNotes: '',
        status: 'draft',
        images: [],
        ebayUrl: '',
        tiktokUrl: '',
        facebookUrl: '',
        instagramUrl: '',
        riskLevel: product.riskLevel,
        featured: false,
        heroFeatured: false,
        bestSeller: false,
        newArrival: false,
        trending: false,
      };
    });

    admin.get('/api/admin/products/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return reply.code(404).send({ error: 'Product not found' });
      return serializeProduct(product);
    });

    admin.post('/api/admin/products', async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const errors = validateProductCreate(body);
      if (errors.length) return reply.code(400).send({ error: errors.join(', ') });

      const slug = await generateUniqueSlug(typeof body.name === 'string' ? body.name : '');
      try {
        const product = await prisma.$transaction(async (tx) => {
          if (body.heroFeatured === true || body.heroFeatured === 'true') {
            await tx.product.updateMany({ where: { heroFeatured: true }, data: { heroFeatured: false } });
          }
          return tx.product.create({ data: buildProductData(body, slug) });
        });
        return reply.code(201).send(serializeProduct(product));
      } catch (err) {
        if (isUniqueViolation(err)) {
          return reply.code(409).send({ error: 'A product with that SKU already exists' });
        }
        throw err;
      }
    });

    admin.put('/api/admin/products/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Product not found' });

      const body = (request.body ?? {}) as Record<string, unknown>;
      const errors = validateProductUpdate(existing, body);
      if (errors.length) return reply.code(400).send({ error: errors.join(', ') });
      const data = buildProductUpdate(body);

      // Keep the slug in sync if the name changed.
      const newName = typeof body.name === 'string' ? body.name.trim() : '';
      if (newName && newName !== existing.name) {
        data.slug = await generateUniqueSlug(newName, id);
      }

      try {
        const product = await prisma.$transaction(async (tx) => {
          if (body.heroFeatured === true || body.heroFeatured === 'true') {
            await tx.product.updateMany({
              where: { heroFeatured: true, id: { not: id } },
              data: { heroFeatured: false },
            });
          }
          return tx.product.update({ where: { id }, data });
        });
        return serializeProduct(product);
      } catch (err) {
        if (isUniqueViolation(err)) {
          return reply.code(409).send({ error: 'A product with that SKU already exists' });
        }
        throw err;
      }
    });

    admin.delete('/api/admin/products/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Product not found' });

      await deleteLocalImages(existing.images, app.log);
      await prisma.product.delete({ where: { id } });
      return { ok: true };
    });

    admin.post('/api/admin/products/:id/archive', async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Product not found' });
      const product = await prisma.product.update({
        where: { id },
        data: {
          status: 'archived',
          visible: false,
          featured: false,
          heroFeatured: false,
          bestSeller: false,
          newArrival: false,
          trending: false,
        },
      });
      return serializeProduct(product);
    });

    // --- Settings ---
    admin.get('/api/admin/settings', async () => getMergedSettings());

    admin.put('/api/admin/settings', async (request) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      return updateSettings(body);
    });
  });
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const text = typeof value === 'string' && /^\s*[=+\-@]/.test(value) ? `'${raw}` : raw;
  return `"${text.replace(/"/g, '""')}"`;
}

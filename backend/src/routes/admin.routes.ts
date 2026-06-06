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
  validateProductCreate,
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
      const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
      return products.map(serializeProduct);
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

      const slug = await generateUniqueSlug(String(body.name));
      try {
        const product = await prisma.product.create({ data: buildProductData(body, slug) });
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
      const data = buildProductUpdate(body);

      // Keep the slug in sync if the name changed.
      const newName = typeof body.name === 'string' ? body.name.trim() : '';
      if (newName && newName !== existing.name) {
        data.slug = await generateUniqueSlug(newName, id);
      }

      try {
        const product = await prisma.product.update({ where: { id }, data });
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

      await prisma.product.delete({ where: { id } });
      await deleteLocalImages(existing.images);
      return { ok: true };
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

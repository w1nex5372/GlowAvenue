import type { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { serializePublicProduct } from '../utils/serialize';
import { getMergedSettings } from '../services/settings.service';

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  // List visible products (optionally filtered by ?category=).
  app.get('/api/products', async (request) => {
    const { category } = request.query as { category?: string };
    const products = await prisma.product.findMany({
      where: {
        visible: true,
        status: { in: ['published', 'out_of_stock'] },
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(serializePublicProduct);
  });

  // Featured products for the homepage.
  app.get('/api/products/featured', async () => {
    const products = await prisma.product.findMany({
      where: { visible: true, featured: true, status: { in: ['published', 'out_of_stock'] } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    return products.map(serializePublicProduct);
  });

  // One independently merchandised homepage hero product.
  app.get('/api/products/hero', async (_request, reply) => {
    const product = await prisma.product.findFirst({
      where: { visible: true, heroFeatured: true, status: { in: ['published', 'out_of_stock'] } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!product) return reply.code(204).send();
    return serializePublicProduct(product);
  });

  // Single product by slug.
  app.get('/api/products/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await prisma.product.findFirst({
      where: { slug, visible: true, status: { in: ['published', 'out_of_stock'] } },
    });
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return serializePublicProduct(product);
  });

  // Public store settings.
  app.get('/api/settings', async () => getMergedSettings());
}

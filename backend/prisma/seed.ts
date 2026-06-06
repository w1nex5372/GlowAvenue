/**
 * Seeds default settings and a handful of sample products so the site is not
 * empty on first run. Safe to run multiple times (uses upsert on unique keys).
 *
 *   npm run seed
 *   docker compose exec backend npm run seed
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Kept in sync with src/constants/settings.ts (inlined so the seed has no
// dependency on the TypeScript source, which is not shipped in the image).
const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: 'GlamAvenue',
  tagline: 'Timeless Elegance',
  heroTitle: 'Timeless Elegance, Everyday Luxury',
  heroSubtitle:
    'Affordable gold plated stainless steel jewellery, designed to last and made to shine.',
  bannerText: 'Free UK delivery on every order',
  shippingText: 'Ships from the UK · 2–4 working days · Tracked delivery',
  contactEmail: 'hello@glamavenue.co.uk',
  instagramUrl: '',
  tiktokUrl: '',
  facebookUrl: '',
  ebayStoreUrl: '',
};

const sampleProducts = [
  {
    sku: 'GA-CELESTE-BR',
    name: 'GlamAvenue Celeste Gold Bracelet',
    slug: 'celeste-gold-bracelet',
    category: 'Bracelets',
    price: '12.99',
    quantity: 25,
    material: '18k Gold Plated Stainless Steel',
    description:
      'A delicate everyday bracelet with a timeless gold finish. Tarnish-resistant, hypoallergenic and made to shine for years.',
    images: [] as string[],
    riskLevel: 'safe',
    visible: true,
    featured: true,
  },
  {
    sku: 'GA-AURELIA-NK',
    name: 'GlamAvenue Aurelia Gold Necklace',
    slug: 'aurelia-gold-necklace',
    category: 'Necklaces',
    price: '14.99',
    quantity: 18,
    material: '18k Gold Plated Stainless Steel',
    description:
      'An elegant layering necklace that elevates any outfit. Lightweight, comfortable and effortlessly luxurious.',
    images: [] as string[],
    riskLevel: 'safe',
    visible: true,
    featured: true,
  },
  {
    sku: 'GA-SERAPHINE-ER',
    name: 'GlamAvenue Seraphine Hoop Earrings',
    slug: 'seraphine-hoop-earrings',
    category: 'Earrings',
    price: '12.99',
    quantity: 30,
    material: '18k Gold Plated Stainless Steel',
    description:
      'Classic gold hoops with a refined, polished finish. The perfect finishing touch for day or evening.',
    images: [] as string[],
    riskLevel: 'safe',
    visible: true,
    featured: false,
  },
  {
    sku: 'GA-MYSTERY-BOX',
    name: 'GlamAvenue Mystery Glam Box',
    slug: 'mystery-glam-box',
    category: 'Bundles',
    price: '19.99',
    quantity: 10,
    material: '18k Gold Plated Stainless Steel',
    description:
      'A curated surprise selection of GlamAvenue pieces, beautifully packaged. The ultimate treat or gift.',
    images: [] as string[],
    riskLevel: 'bundle',
    visible: true,
    featured: true,
  },
];

async function main() {
  // Settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // Products
  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, price: new Prisma.Decimal(p.price) },
    });
  }

  console.log(`Seeded ${sampleProducts.length} products and ${Object.keys(DEFAULT_SETTINGS).length} settings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

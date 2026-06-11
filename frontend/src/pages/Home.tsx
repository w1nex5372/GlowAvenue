import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Sparkles, ShieldCheck, Gift } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { useSettings } from '../lib/SettingsContext';
import { formatPrice } from '../lib/format';
import Logo from '../components/Logo';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';

const VALUES = [
  { icon: Sparkles, title: '18k Gold Plated', text: 'Premium gold plated stainless steel that keeps its shine.' },
  { icon: ShieldCheck, title: 'Skin Safe', text: 'Tarnish-resistant and gentle on skin, made to last.' },
  { icon: Truck, title: 'UK Delivery', text: 'Shipped from the UK with fast, tracked delivery.' },
  { icon: Gift, title: 'Gift Ready', text: 'Every piece arrives beautifully packaged.' },
];

export default function Home() {
  const settings = useSettings();
  const [heroFeatured, setHeroFeatured] = useState<Product | undefined>();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getHeroFeatured(), api.getFeatured(), api.getProducts()])
      .then(([hero, f, all]) => {
        setHeroFeatured(hero);
        setFeatured(f);
        const selectedNew = all.filter((product) => product.newArrival);
        const remaining = all.filter((product) => !product.newArrival);
        setLatest([...selectedNew, ...remaining].slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hero = heroFeatured;

  return (
    <>
      {/* Hero */}
      <section className="bg-cream">
        <div className="container-luxe grid items-center gap-12 py-14 md:min-h-[680px] md:grid-cols-[0.9fr_1.1fr] md:py-20 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="min-w-0"
          >
            <span className="eyebrow">{settings.tagline || 'Timeless Elegance'}</span>
            <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/65 sm:text-lg">{settings.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/collection" className="btn-gold">
                Shop the Collection <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn-outline">
                Our Story
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="relative min-w-0"
          >
            {hero?.images?.[0] ? (
              <Link
                to={`/product/${hero.slug}`}
                className="group block rounded-[2rem] border border-gold/15 bg-white/70 p-3 shadow-card transition-shadow duration-500 hover:shadow-gold sm:p-5"
              >
                <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white via-cream/50 to-beige/40">
                  <img
                    src={hero.images[0]}
                    alt={hero.name}
                    fetchPriority="high"
                    className="aspect-[4/5] w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                  />
                  <div className="absolute bottom-4 left-4 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-ink shadow-soft backdrop-blur sm:bottom-5 sm:left-5 sm:px-5">
                    <span className="block font-serif text-xl sm:text-2xl">From {formatPrice(hero.price)}</span>
                    <span className="mt-0.5 block text-[0.6rem] uppercase tracking-luxe text-ink/50">Everyday luxury</span>
                  </div>
                </div>
                <div className="px-2 pb-2 pt-5 sm:px-3 sm:pb-3 sm:pt-6">
                  <span className="eyebrow">Featured Piece</span>
                  <h2 className="mt-2 font-serif text-2xl leading-tight text-ink sm:text-3xl">{hero.name}</h2>
                  {hero.shortDescription && (
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60 sm:text-base">
                      {hero.shortDescription}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-dark">
                    Discover the piece <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[2rem] border border-gold/15 bg-gradient-to-br from-white via-cream to-beige/60 p-10 text-gold shadow-card">
                <div className="rounded-full border border-gold/15 bg-white/55 px-10 py-14 shadow-soft backdrop-blur-sm">
                  <Logo variant="stacked" tagline />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      {(loading || featured.length > 0) && (
        <section className="bg-white">
          <div className="container-luxe py-20 md:py-28">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading align="left" eyebrow="Curated for you" title="Featured Pieces" subtitle="Considered designs selected for their effortless, everyday elegance." />
              <Link to="/collection" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-gold-dark transition hover:text-gold">
                Explore the collection <ArrowRight size={16} />
              </Link>
            </div>
            {loading ? (
              <ProductGridSkeleton />
            ) : (
              <div className="mt-12 product-grid md:mt-14">
                {featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why GlamAvenue */}
      <section className="bg-cream">
        <div className="container-luxe py-20 md:py-28">
          <SectionHeading eyebrow="Why GlamAvenue" title="Luxury you can wear every day" />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                  <Icon size={24} />
                </span>
                <h3 className="mt-5 font-serif text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink/60">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {latest.length > 0 && (
        <section className="bg-white">
          <div className="container-luxe py-20 md:py-28">
            <div className="flex items-end justify-between gap-4">
              <SectionHeading align="left" eyebrow="Just In" title="New Arrivals" />
              <Link to="/collection" className="hidden shrink-0 items-center gap-1 text-sm text-gold-dark hover:text-gold sm:inline-flex">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-12 product-grid md:mt-14">
              {latest.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About preview */}
      <section className="bg-ink text-cream">
        <div className="container-luxe grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="eyebrow">Our Story</span>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
              Affordable elegance, crafted to last
            </h2>
            <p className="mt-5 text-cream/70">
              {settings.storeName || 'GlamAvenue'} brings you considered, gold plated stainless steel
              jewellery — designed in the spirit of timeless luxury, priced for everyday joy.
            </p>
            <Link to="/about" className="btn-gold mt-8">
              Discover GlamAvenue <ArrowRight size={18} />
            </Link>
          </div>
          <div className="flex justify-center">
            <Logo variant="stacked" tagline className="text-gold" />
          </div>
        </div>
      </section>

      {/* Marketplace CTA */}
      <section className="bg-beige/40">
        <div className="container-luxe py-16 text-center md:py-20">
          <SectionHeading
            eyebrow="Where to buy"
            title="Shop GlamAvenue across your favourite marketplaces"
            subtitle="Each product links straight through to where you can buy it. Browse the collection to find your piece."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/collection" className="btn-dark">
              Browse the Collection <ArrowRight size={18} />
            </Link>
            {settings.ebayStoreUrl && (
              <a href={settings.ebayStoreUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Visit our eBay Store
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="mt-12 product-grid md:mt-14" aria-label="Loading products">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-cream" />
          <div className="mt-5 h-2.5 w-20 rounded bg-beige/50" />
          <div className="mt-3 h-5 w-4/5 rounded bg-cream" />
          <div className="mt-5 h-5 w-16 rounded bg-cream" />
        </div>
      ))}
    </div>
  );
}
